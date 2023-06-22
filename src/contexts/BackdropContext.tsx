import { useState, createContext, useContext, useEffect, useRef } from "react";
import { useEditor } from "../components/Editor";
import { getNodesInRange, isBrBetweenTextNodes } from "../Utilities/editors";
import { clamp } from "../Utilities/colors";

type BackdropContextProps = {    
    showNonePrintingCharacters: boolean
    highLightTextContainer: React.RefObject<HTMLDivElement>
    isTextBeingSearched: boolean
    searchedText: string
    instances: number
    currentInstance: number
    matchCase: boolean
}

type BackdropUpdateContextProps = {
    setShowNonePrintingCharacters: React.Dispatch<React.SetStateAction<boolean>>
    setIsTextBeingSearched: React.Dispatch<React.SetStateAction<boolean>>
    setSearchedText: React.Dispatch<React.SetStateAction<string>>
    setInstances: React.Dispatch<React.SetStateAction<number>>
    setCurrentInstance: React.Dispatch<React.SetStateAction<number>>
    setMatchCase: React.Dispatch<React.SetStateAction<boolean>>
    replaceAllOccurrences: (replaceStr: string, onlyXOccurrence?: number | undefined) => void
    findAndReplaceText: (replacementText: string) => void
    highlightNext: (changeInIndex: number) => void
}    

const BackdropContext = createContext({} as BackdropContextProps)
const BackdropUpdate = createContext({} as BackdropUpdateContextProps)


export function useBackdrop(){
    return useContext(BackdropContext)
}

export function useBackdropUpdate(){
    return useContext(BackdropUpdate)
}

const BackdropProvider = ({ children }: {children: React.ReactNode}): JSX.Element => {
    const [searchedText, setSearchedText] = useState("")
    const [isTextBeingSearched, setIsTextBeingSearched] = useState(false)
    const [showNonePrintingCharacters, setShowNonePrintingCharacters] = useState(false)
    const highLightTextContainer = useRef<HTMLDivElement>(null);
    const [instances, setInstances] = useState(0)
    const [currentInstance, setCurrentInstance] = useState(0)
    const [matchCase, setMatchCase] = useState(false)

    const editorValues = useEditor()

    useEffect(() => {
        let textInBackdrop = editorValues.textDocument.value
        highLightTextContainer.current!.innerHTML = textInBackdrop
        textInBackdrop = removeStylesWithColor(textInBackdrop, showNonePrintingCharacters)
        if(showNonePrintingCharacters){
          
            const replace = (inputString: string) => {
                const regex = /<brs*\/?>/gi;
                const result = inputString.replace(regex, '<span class="line-break"><br></span>');
                return result
            }
            textInBackdrop = replace(textInBackdrop)
        }
           
        if(!editorValues.markdownInput.current || !highLightTextContainer.current){
            highLightTextContainer.current!.innerHTML = textInBackdrop
            return
        }
        if(searchedText==="" || !isTextBeingSearched){
            highLightTextContainer.current!.innerHTML = textInBackdrop
            return
        }

        const highlightResult = highlightAllOccurrences(textInBackdrop, searchedText)

        highLightTextContainer.current!.innerHTML = highlightResult.text
        setInstances(highlightResult.count)
        // setInstances(highlightResult.count)
       // setCurrentInstance(highlightResult.count === 0? 0: 1)

    }, [searchedText, matchCase, isTextBeingSearched, editorValues.textDocument.value, showNonePrintingCharacters]);

    const removeStylesWithColor = (html: string, showNonePrintingCharacters: boolean): string => {
        const dummyElement = document.createElement('div');
        dummyElement.innerHTML = html;

        const elements = dummyElement.querySelectorAll('*');
        elements.forEach((element) => {
            (element as HTMLElement).style.color = ""
        });
    
        if(showNonePrintingCharacters){
            const textNodes = getTextNodes(dummyElement);

            // Replace spaces in each text node
            textNodes.forEach((node) => {
                const text = node.textContent || '';
                
                const fragment = document.createDocumentFragment();
                
                const flags = matchCase ? 'g' : 'gi';
                const regex = new RegExp(" ", flags);
                
                let lastIndex = 0;
                let match: RegExpExecArray | null;
    
                while ((match = regex.exec(text))) {
                    const beforeText = text.substring(lastIndex, match.index);
                
                    if (beforeText.length > 0) {
                      fragment.appendChild(document.createTextNode(beforeText));
                    }
                    
                    const spanElement = document.createElement('span');
                    spanElement.textContent = " ";
                    spanElement.className="space-ball"
                    fragment.appendChild(spanElement);
                
                    lastIndex = regex.lastIndex;
                }
                
                if (lastIndex < text.length) {
                    const remainingText = text.substring(lastIndex);
                    fragment.appendChild(document.createTextNode(remainingText));
                }
                // Replace the current text node with the new element
                node.parentNode?.replaceChild(fragment, node);  
                return
            });
        }
        const cleanedHtml = dummyElement.innerHTML;
        dummyElement.remove(); // Clean up: remove the dummy element

        return cleanedHtml;
        
    };

    function getTextNodes(element: HTMLElement): Node[] {
        const textNodes: Node[] = [];
      
        function traverse(element: Node) {
          if (element.nodeType === Node.TEXT_NODE) {
            textNodes.push(element);
          } else if (element.nodeType === Node.ELEMENT_NODE) {
            const childNodes = element.childNodes;
            for (let i = 0; i < childNodes.length; i++) {
              traverse(childNodes[i]);
            }
          }
        }
      
        traverse(element);
        return textNodes;
    }

    const findAndReplaceText = (replacementText: string) => {
        const element = editorValues.markdownInput.current!
        const regex = new RegExp(searchedText, 'gi');
        element.innerHTML = element.innerHTML.replace(regex, replacementText);
        editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, false)
        setInstances(0)
        setCurrentInstance(0)
    }

    const highlightAllOccurrences = (string: string, substring: string) => {
        const dummyElement = document.createElement('div');
        dummyElement.innerHTML = string;

        const range = new Range()
        range.setStart(dummyElement, 0)
        range.setEnd(dummyElement, dummyElement.children.length)
        const textNodes = getNodesInRange(range, ["#text"], dummyElement)
        let count = 0;
        let modifiedTextNodeInfo: {index: number, replacementNode: null|HTMLElement} = {index: -1, replacementNode: null}
        substring = substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');  

        textNodes.forEach((node, indexNode)=>{
            const gapBetweenNextTextNode = thereIsNoGapBetweenTextNodes(node,textNodes[indexNode+1])

            if(modifiedTextNodeInfo.index>indexNode){
                return
            }

            if(modifiedTextNodeInfo.index===indexNode){
                if(!modifiedTextNodeInfo.replacementNode) return
                
                node = modifiedTextNodeInfo.replacementNode
            }
            
            let text = node.textContent || ""    
            const fragment = document.createDocumentFragment();
            
            const flags = matchCase ? 'g' : 'gi';
            const regex = new RegExp(substring, flags);
            
            let lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = regex.exec(text))) {

                const beforeText = text.substring(lastIndex, match.index);
                const matchedText = match[0];
            
                if (beforeText.length > 0) {
                  fragment.appendChild(document.createTextNode(beforeText));
                }
                
                count = count + 1
 
                const markElement = document.createElement('mark');
                markElement.textContent = matchedText;
                fragment.appendChild(markElement);
            
                lastIndex = regex.lastIndex;
            }
            
            let remainingText = text
            if (lastIndex < text.length && fragment.childNodes.length>0) {
                remainingText = text.substring(lastIndex);
                fragment.appendChild(document.createTextNode(remainingText));
            }
            // Replace the current text node with the new element
            const lastTextNode = fragment.childNodes.length>0? fragment.lastChild: node // last node will be text if remaining text existed
            if(fragment.childNodes.length>0){
                node.parentNode?.replaceChild(fragment, node); 
            }
            
            if(remainingText==="") {
                return
            }

            const continueSearch = checkIfStringPossibleFromCurrentSubstring(lastTextNode!.textContent!, substring)
 
            if(continueSearch && textNodes[indexNode+1] && gapBetweenNextTextNode){
                
                const nodes = [{node: lastTextNode!, text: lastTextNode?.textContent!}]
                const result = checkForHighlightBetweenNodes(nodes, textNodes[indexNode+1], matchCase, indexNode+1, textNodes, substring)

                if(result){
                    count = count + 1
                    const lastReplaced = result[result.length-1]
                    const indexOfTextNode = indexNode+result.length-1
                    const lastTextNode = findTextAfterLastMarkNode(lastReplaced.nodesAdded)

                    modifiedTextNodeInfo = {replacementNode: lastTextNode, index: indexOfTextNode}
                }
            }
               
        })
        if(count===0){
            setCurrentInstance(0)
        }else{
            const allMarks = Array.from(dummyElement.querySelectorAll('mark'))
            const currentMarkIndexToHighlight = clamp(currentInstance, 1, allMarks.length)
            highlighInstance(allMarks, currentMarkIndexToHighlight, substring)
            const mark = allMarks[currentMarkIndexToHighlight-1]

            if(mark){
                mark.classList.add("mark-highlighted")
                setCurrentInstance(currentMarkIndexToHighlight)
            }
        }
        
        return {text: dummyElement.innerHTML, count}
    }

    function findTextAfterLastMarkNode(elements: ChildNode[]): HTMLElement | null {
        const markNode = elements.findLast((element)=>element.nodeName==="MARK")

        if (!markNode) {
            return null
        } 

        return markNode.nextSibling as HTMLElement; 
    }

    
    const highlightNext = (changeInIndex: number) => {
        const allMarks = Array.from( highLightTextContainer.current!.querySelectorAll('mark'))
        let indexToUpdate = currentInstance + changeInIndex
        if(indexToUpdate<1){
            indexToUpdate = instances
        }else if(indexToUpdate>instances){
            indexToUpdate = 1
        }

        allMarks.forEach((mark)=>mark.className="")
        highlighInstance(allMarks, indexToUpdate, searchedText)
        
        setCurrentInstance(indexToUpdate)
    }

    const highlighInstance = (allMarks: HTMLElement[], indexToHighlight: number, matchedText: string) => {
        let textUnusedInPreviousMarks = ""
        let previousNotFullMarks: HTMLElement[] = []
        let currentCount = 1
        for(let i=0; i<allMarks.length; i++){
            const mark = allMarks[i]
            if(mark.textContent===matchedText||textUnusedInPreviousMarks+mark.textContent===matchedText){
                if(currentCount===indexToHighlight){
                    mark.className = "mark-highlighted"

                    previousNotFullMarks.forEach((node)=>{
                        node.className="mark-highlighted"
                    })
                    break
                } 
                textUnusedInPreviousMarks = ""
                previousNotFullMarks  = []
                currentCount = currentCount + 1
                continue 
            }

            textUnusedInPreviousMarks = textUnusedInPreviousMarks + mark.textContent
            previousNotFullMarks.push(mark)
        }
    }

    const checkForHighlightBetweenNodes = (
        previousNodes: { node: Node; text: string }[],
        currentNode: Node,
        matchCases: boolean,
        currentIteration: number,
        allTextNodes: Node[],
        searchedSubstring: string
      ): { node: Node; nodesAdded:  ChildNode[]}[] | null => {      
        const previousText = previousNodes.reduce((acc, node) => acc + node.text, "");
        const wholeText = previousText + currentNode.textContent

        previousNodes.push({node: currentNode, text: currentNode.textContent || ""})
        let startIndex;
        if (matchCases) {
            startIndex = wholeText.indexOf(searchedSubstring);
        } else {
            startIndex = wholeText.toLowerCase().indexOf(searchedSubstring.toLowerCase());
        }

        if(startIndex > previousText.length-1){
            return null
        }
        
        if(startIndex!==-1){ // check if find searched string
            const nodesWithTextToReturn = []
            let indexToStartOfThisNode = 0
            for(let i=0; i<previousNodes.length; i++){
                const fragment = document.createDocumentFragment();
                const text = previousNodes[i].text

                const startIndexOfModifiedText = Math.max(startIndex-indexToStartOfThisNode, 0)
                const endIndex = Math.min(startIndex+searchedSubstring.length-indexToStartOfThisNode, text.length);

                const beforeText = text.substring(0, startIndexOfModifiedText);

                if (beforeText.length > 0) {
                  fragment.appendChild(document.createTextNode(beforeText));
                }
                
                const markElement = document.createElement('mark');
                markElement.textContent = text.slice(startIndexOfModifiedText, endIndex);
 
                fragment.appendChild(markElement)

                if (endIndex < text.length) {
                    
                    const remainingText = text.substring(endIndex)
  
                    fragment.appendChild(document.createTextNode(remainingText))
                }

                nodesWithTextToReturn.push({node: previousNodes[i].node, nodesAdded: [...fragment.childNodes]})
                previousNodes[i].node.parentNode?.replaceChild(fragment, previousNodes[i].node)
                indexToStartOfThisNode = indexToStartOfThisNode + text.length
            }

            return nodesWithTextToReturn
        }
        const continueSearch = checkIfStringPossibleFromCurrentSubstring(wholeText, searchedSubstring)
        
        if(continueSearch && allTextNodes[currentIteration+1] && thereIsNoGapBetweenTextNodes(currentNode,allTextNodes[currentIteration+1])){
            return checkForHighlightBetweenNodes(previousNodes, allTextNodes[currentIteration+1], matchCases, currentIteration+1, allTextNodes, searchedSubstring)
        }else{
            return null
        }
      }

      const replaceAllOccurrences = (replaceStr: string, onlyXOccurrence?: number|undefined): void => {
        if(replaceStr===searchedText) return

        const element = editorValues.markdownInput.current!;
        const range = new Range()
        range.setStart(element, 0)
        range.setEnd(element, element.children.length)
        const textNodes = getNodesInRange(range, ["#text"], element)
        const substring = searchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
        let count = 0
        
        let skippingNodesInfo: {node: undefined|Node, textIndex: number} = {node: undefined, textIndex: 0}
        textNodes.forEach((node, indexNode)=>{
            if(onlyXOccurrence && count>onlyXOccurrence) return

            let textAlreadyChecked = ""
            let text = node.textContent || ''
            if(skippingNodesInfo.node){
                if(node!==skippingNodesInfo.node) return
                text = text.slice(skippingNodesInfo.textIndex)
                textAlreadyChecked = text.slice(0, skippingNodesInfo.textIndex)
                skippingNodesInfo = {node: undefined, textIndex: 0}  
            }
            
            
            const flags = matchCase ? 'g' : 'gi'
            const regex = new RegExp(substring, flags)
            
            let lastIndex = 0
            let match: RegExpExecArray | null
            let result = ""
            while ((match = regex.exec(text))) {
                count = count + 1 
                const { index } = match;
                if (count === onlyXOccurrence || !onlyXOccurrence) {
                  result += text.slice(lastIndex, index) + replaceStr
                } else {
                  result += text.slice(lastIndex, regex.lastIndex)
                }
                lastIndex = regex.lastIndex
            }

            let endIndexOfLastReplacement = 0
            result = textAlreadyChecked + result
            if(result!==""){
                endIndexOfLastReplacement  = result.length
            }
            
            result += text.slice(lastIndex)
                  
            if(result!==text){
                node.textContent = result
            }

            if(onlyXOccurrence && count>onlyXOccurrence) return
            const continueSearch = checkIfStringPossibleFromCurrentSubstring(result.slice(endIndexOfLastReplacement), substring)
            
            if(continueSearch && textNodes[indexNode+1] && thereIsNoGapBetweenTextNodes(node,textNodes[indexNode+1])){
                const result = replaceBetweenNodes([node], textNodes[indexNode+1], matchCase, endIndexOfLastReplacement, onlyXOccurrence,
                    count, indexNode+1, textNodes, substring, replaceStr)
                if(result){
                    count = count + 1
                    skippingNodesInfo = {node: result.textNodeToCheckNext, textIndex: result.startIndex}
                }    

            }
            
        })
        editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, false)  
        //editorUpdate.restoreSelection()
    }  

    const thereIsNoGapBetweenTextNodes = (textNode1: Node, textNode2: Node) => {
        if(!textNode1 || !textNode2) return false
        return !isBrBetweenTextNodes(textNode1,textNode2, editorValues.markdownInput.current!) && textNode1.parentNode?.parentNode === textNode2.parentNode?.parentNode
    }

    const checkIfStringPossibleFromCurrentSubstring = (text: string, searchedString: string) => {
        for (let i = 0; i < text.length; i++) {
            const substring = text.substring(text.length - i - 1);
            const isSubstringStartOfSearchedWord = matchCase? searchedString.startsWith(substring): searchedString.toLocaleLowerCase().startsWith(substring.toLocaleLowerCase())
            
            if(isSubstringStartOfSearchedWord){
                return true
                
            }
            const isSubstringPartOfSearchedWord = matchCase? searchedString.includes(substring): searchedString.toLocaleLowerCase().includes(substring.toLocaleLowerCase())
            if (!isSubstringPartOfSearchedWord){
                return false
            }
        }
    }

    const replaceBetweenNodes = (previousNodes: Node[], currentNode: Node, matchCases: boolean, startIndexOfText: number, 
        replaceOnlyXOccurrence: number|undefined, currentOccurrence: number,
        currentIteration: number, allTextNodes: Node[], substring: string, replacementString: string)
        : { textNodeToCheckNext: Node; startIndex: number} | undefined =>{
        
        let previousText = previousNodes.reduce((acc, node) => acc + node.textContent, "");
    
        const wholeText = previousText + currentNode.textContent
        const wholeTextTrimmed = wholeText.slice(startIndexOfText)
        previousNodes.push(currentNode)
        
        let startIndex;
        if (matchCases) {
            startIndex = wholeTextTrimmed.indexOf(substring);
        } else {
            startIndex = wholeTextTrimmed.toLowerCase().indexOf(substring.toLowerCase());
        }
        
        if(startIndex!==-1){ // check if find searched string
            if(startIndex>previousText.length-1){ // if found text begins after previous node we dont need to handle it since it will be handled later down the loop
                return
            }
            
            currentOccurrence = currentOccurrence + 1 

            let indexBeforeThisNodeInText = 0
            const textInNodes = wholeText.slice(0, startIndex+startIndexOfText) + replacementString

            const textAfterReplacement = wholeText.slice(startIndex+startIndexOfText+substring.length)
            let infoToReturn: {
                textNodeToCheckNext: Node;
                startIndex: number;
            } | undefined  

            for(let i=0; i<previousNodes.length; i++){
                const node = previousNodes[i]
                
                const textLength = node.textContent?.length || 0
                const endIndexOfText = indexBeforeThisNodeInText + textLength
                let newText = textInNodes.slice(indexBeforeThisNodeInText, endIndexOfText)
                
                indexBeforeThisNodeInText = indexBeforeThisNodeInText + textLength
                if(i===previousNodes.length-1){

                    infoToReturn = {textNodeToCheckNext: node, startIndex: newText.length}
                    newText += textAfterReplacement           
                }

                if(!replaceOnlyXOccurrence || currentOccurrence===replaceOnlyXOccurrence){
                    node.textContent = newText
                }  
            }
        
            return infoToReturn
        }
        const continueSearch = checkIfStringPossibleFromCurrentSubstring(wholeText, substring)
        
        if(continueSearch && allTextNodes[currentIteration+1] && thereIsNoGapBetweenTextNodes(currentNode,allTextNodes[currentIteration+1])){
            return replaceBetweenNodes(previousNodes, allTextNodes[currentIteration+1], matchCases, startIndexOfText, replaceOnlyXOccurrence,
                currentOccurrence, currentIteration+1, allTextNodes, substring, replacementString)
        }
    }

    return (
        <BackdropContext.Provider value={{searchedText, isTextBeingSearched, currentInstance, instances, matchCase,
            showNonePrintingCharacters, highLightTextContainer}}>
            <BackdropUpdate.Provider value={{setShowNonePrintingCharacters, setSearchedText, setInstances, 
                setMatchCase, findAndReplaceText, highlightNext,
                setIsTextBeingSearched, setCurrentInstance, replaceAllOccurrences}}>
                {children}   
            </BackdropUpdate.Provider>
        </BackdropContext.Provider>
    )
}

export default BackdropProvider