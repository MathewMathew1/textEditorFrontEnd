
import "./Editor.css";
import { useCallback } from "react";
import {
    SelectionRestorerFromText, getParentNodeWithTag, deleteNode, getNodesInRange, changeTag, getRangeBetweenElements,
    createElementInRange, checkIfAllElementsHaveSameValue,  splitNodes, getCommonValueForElements, getTextOutsideRange, findColumnParent, getFurthestDeletableNode, isNestedFirstChild, groupElementsByParent, splitNodesInRange
} from "../Utilities/editors";
import "./Editor.css";
import useHistorySaver from "../customhooks/useHistorySaver";
import useSelection from "../customhooks/useSelection";
import { TextDocument } from "../types";
import { EditorContext, EditorUpdate } from "../contexts/UseEditorProvider";
import useEditorState from "../customhooks/useEditorState";
import useHandleDocument from "../customhooks/useHandleDocument";
import useDocumentLoader from "../contexts/useDocumentLoader";
import { useHandleStyling } from "../customhooks/useHandlingStyle";
import { useHandleSelectionChanges } from "../customhooks/useHandleSelectionChanges";


export const ALIGN_TYPES = {
    Center: "center",
    Left: "left",
    Right: "right",
    Justify: "justify",
    None: "none"
}

const DEFAULT_VALUES = {
    Color: "rgb(0,0,0)",
    BackgroundColor: "rgb(255,255,255)",
    FontSize: "12",
    Font: "Times New Roman"
}




const Editor = ({children, originalDocument, storedInDatabase}:{children: any, originalDocument: TextDocument, storedInDatabase: boolean}) => {
    const { state, update } = useEditorState(originalDocument.title);
    
    const {
    spellCheck, scale, fontSize, textBolded, textItalic, textUnderScore, color, comment, backgroundColor,
    font, link, convertedMarkdown, offsetForRuler, markdownInput, align, numberedList, bulletedList,
    marginLeft, marginRight, showRuler, paddingBottom, paddingTop, currentPage, title, columnLayoutOnSelectedPage
    } = state;

  const {
    setSpellCheck, setScale, setFontSize, setTextBolded, setTextItalic, setTextUnderScore, setColor, setComment,
    setBackgroundColor, setFont, setLink, setConvertedMarkdown, setOffsetForRuler, setAlign, setShowRuler,
    setMarginLeft, setMarginRight, setPaddingBottom, setPaddingTop, setCurrentPage, setTitle, setColumnLayoutOnSelectedPage,
    setBulletedList, setNumberedList
  } = update;

    const {savedSelection, restoreSelection} = useSelection(markdownInput)
    const textDocument = useHistorySaver(originalDocument.text)
    
     const {setDocumentLoaded, documentLoaded} = useDocumentLoader({
        markdownInput
    });
    const { updateTitle } = useHandleDocument({
        originalDocument,
        textDocument,
        storedInDatabase,
        setTitle,
        setDocumentLoaded,
    });

  
    const {addStylingToSpan} = useHandleStyling(markdownInput, textDocument)
    const listenToSelectionChanges = useHandleSelectionChanges({markdownInput, setters: update})

 
    const updateParagraphs = ({property, propertyValue, callback, passedRange=null}:
        {
            property: string, 
            propertyValue: 
            string, callback?: (paragraph: HTMLElement, value: string) => void,
            passedRange?: Range|null
        }) => {
      
        const selection = window.getSelection();
        
        if (!selection && !passedRange)  return;
        
        let range = passedRange? passedRange: selection!.getRangeAt(0);
        const paragraphs = getNodesInRange(range ,["P", "LI", "TABLE"], markdownInput.current!)
        paragraphs.forEach((paragraph: Node) => {
            const htmlElement = paragraph as HTMLElement;
            if (callback) {
                callback(htmlElement, propertyValue);
                return
            }
            
            htmlElement.style[property as any] = propertyValue
            
        })
        textDocument.saveValue(markdownInput.current!.innerHTML, true, true);
    }

   

    const addList = (listType: string) => {
        const selection = window.getSelection();
        if (!selection) return;
        
        let range = selection.getRangeAt(0)
    
        const rangeToRestore = new SelectionRestorerFromText()
        const parentNodeOfStart = range.startContainer
        const parentNodeOfEnd = range.endContainer
        const endOffset = range.endOffset
        const startOffset = range.startOffset
        const spans = getNodesInRange(range, ["SPAN"], markdownInput.current!)
        const pageSpan = spans.find((node)=>(node as HTMLElement).className==="page") 
        const columnInfo = getStatusAboutCurrentColumns(pageSpan!, range)
        
        if(parentNodeOfStart && parentNodeOfEnd) rangeToRestore.saveRange(range, parentNodeOfStart, parentNodeOfEnd)

        const parentList = getParentNodeWithTag(range.commonAncestorContainer, ["ul", "ol"])
        if(columnInfo.currentColumnReference && !columnInfo.currentColumnReference?.contains(parentList)) parentList === null // if list in different column ignore it

        if(parentList?.textContent == range.toString()){
  
            if(listType.toUpperCase() != parentList.nodeName){
                changeTag(parentList, listType)
                range.setStart(parentNodeOfStart,startOffset)
                range.setEnd(parentNodeOfEnd, endOffset)
                return
            }

            const listRange = new Range();
            listRange.setStartBefore(parentList);
            listRange.setEndAfter(parentList);

            const listObject = getNodesInRange(range ,["LI"], markdownInput.current!).filter((node)=>
                columnInfo.currentColumnReference?.contains(node) || !columnInfo.currentColumnReference)
            listObject.forEach((object)=>{
                changeTag(object, "p")
            })
            deleteNode(parentList)
    
            range.setStart(parentNodeOfStart,startOffset)
            range.setEnd(parentNodeOfEnd, endOffset)
            textDocument.saveValue(markdownInput.current!.innerHTML, true, true)
            return
        }
        
        if(parentList){
            const listElements = getNodesInRange(range ,["LI"], markdownInput.current!).filter((node)=>
                columnInfo.currentColumnReference?.contains(node) || !columnInfo.currentColumnReference
            )
      
            const listRange = new Range();
            listRange.setStart(parentList, 0);
            listRange.setEndBefore(listElements[0]);
            if(!listRange.collapsed) createElementInRange(parentList.nodeName, listRange)
                    
            const rangeTillTheEndOfList = new Range();
            rangeTillTheEndOfList.setStartAfter(listElements[listElements.length-1]);
            rangeTillTheEndOfList.setEnd(parentList, parentList.childNodes.length);
            if(!rangeTillTheEndOfList.collapsed) createElementInRange(parentList.nodeName, rangeTillTheEndOfList)

            const rangeForNewList = new Range();
            rangeForNewList.setStartBefore(listElements[0]);
            rangeForNewList.setEndAfter(listElements[listElements.length-1])
            if(listType.toUpperCase() != parentList.nodeName){
                
                createElementInRange(listType, rangeForNewList)
                deleteNode(parentList)
                range.setStart(parentNodeOfStart,startOffset)
                range.setEnd(parentNodeOfEnd, endOffset)
                textDocument.saveValue(markdownInput.current!.innerHTML, true, true)
                return
            }
            
            const elementsToChange = getNodesInRange(range ,["LI"], markdownInput.current!).filter((node)=>
                columnInfo.currentColumnReference?.contains(node) || !columnInfo.currentColumnReference
            )
            elementsToChange.forEach((elementToChange)=> {
                changeTag(elementToChange, "p")
            })
            
            deleteNode(parentList)
            
            range.setStart(parentNodeOfStart,startOffset)
            range.setEnd(parentNodeOfEnd, endOffset)
            textDocument.saveValue(markdownInput.current!.innerHTML, true, true)
            return         
        }
        
        const paragraphs = getNodesInRange(range ,["P", "LI"], markdownInput.current!).filter((node)=>{
            return columnInfo.currentColumnReference?.contains(node) || !columnInfo.currentColumnReference
        })
        let wholeRangeInList = getRangeBetweenElements(paragraphs[0], paragraphs[paragraphs.length-1])

        const listsInside = getNodesInRange(wholeRangeInList ,["OL", "UL"], markdownInput.current!).filter((node)=>
            columnInfo.currentColumnReference?.contains(node) || !columnInfo.currentColumnReference
        ) 
        listsInside.forEach((list)=>{
            deleteNode(list)
        })
        // range get messed up after deleting lists inside
        wholeRangeInList = getRangeBetweenElements(paragraphs[0], paragraphs[paragraphs.length-1])
        
        const listElement = document.createElement(listType);
        wholeRangeInList.surroundContents(listElement)
        paragraphs.forEach((paragraph)=> {
            if(paragraph.nodeName==="li") return
            changeTag(paragraph, "li")
        })
        
        range.setStart(parentNodeOfStart,startOffset)
        range.setEnd(parentNodeOfEnd, endOffset)
        textDocument.saveValue(markdownInput.current!.innerHTML, true, true)
    }

    
    const getStatusAboutCurrentColumns = (pageSpan: Node, range: Range) => {
        const gridColumnValue = window.getComputedStyle((pageSpan as HTMLElement)).gridTemplateColumns;
        const gridColumnArray = gridColumnValue.split(' ');
        let currentColumn: null|HTMLElement = null
        let inWhichColumnSelectionLies = 1

        for(let i=0; i<pageSpan.childNodes.length; i++){
            if(range.intersectsNode(pageSpan.childNodes[i]) && (pageSpan.childNodes[i] as HTMLElement).className==="column"){
                inWhichColumnSelectionLies = i + 1
                currentColumn = pageSpan.childNodes[i] as HTMLElement
                break
            }
        }

        return{columns: gridColumnArray.length, 
            currentColumn: inWhichColumnSelectionLies,
            widths: gridColumnArray, currentColumnReference: currentColumn }     
    }

    const addImage = ({imageUrl, passedRange}:{imageUrl: string, passedRange?: Range|null}) => {
        let selection = window.getSelection()
        if(selection===null) return

        if(markdownInput.current===null) return
        
        let range =  passedRange? passedRange: selection.getRangeAt(0)
        const parentNodeOfStart = getParentNodeWithTag(range.startContainer, ["p", "li"])! as HTMLElement

        const startRange = new Range()
        startRange.setStart(range.startContainer, range.startOffset)
        startRange.setEnd(range.startContainer, range.startOffset)
        let splitNode = splitNodes(parentNodeOfStart, startRange)
        if(splitNode){
            range.setStartBefore(splitNode)
            range.setEndBefore(splitNode)
        }
        
        const image = document.createElement("img")
        image.src = imageUrl
        image.style.maxWidth = "100%"

  
        range.insertNode(image)
        textDocument.saveValue(markdownInput.current!.innerHTML, true, true)
    }

    const addLink = ({linkName, linkText, passedRange=null}:{linkName: string, linkText?: string|undefined, passedRange?: Range|null}) =>{
        let selection = window.getSelection()
        if(selection===null) return

        if(markdownInput.current===null) return
        
        let range =  passedRange? passedRange: selection.getRangeAt(0)
        const parentNode = getParentNodeWithTag(range.startContainer, ["p", "li"])

        if(!parentNode) return
        if(range.toString()===""){
            
            const nodeSplit = splitNodes(parentNode, range)
            if(nodeSplit){
               range.setStartBefore(nodeSplit)
               range.setEndBefore(nodeSplit)
            }
            const link = createElementInRange("a", range)
            link.setAttribute('href', linkName);
            link.textContent = linkText? linkText: linkName
           
            range.setStart(link, 0)
            range.setEnd(link, link.childNodes.length)
            createElementInRange("span", range)

            if(nodeSplit?.textContent==="") deleteNode(nodeSplit)
        }else{
            const allSpansAndText= getNodesInRange(range, ["SPAN", "#text"], markdownInput.current!)
            const allSpans = allSpansAndText.filter((node)=>{
                const element = node as HTMLElement
                return element.nodeName==="SPAN" && element.classList.length===0
            })
            const allTextWithoutSpan = allSpansAndText.filter((element)=>{
                return element.nodeName==="#text" && element.parentNode?.nodeName!=="SPAN"
            })
            allTextWithoutSpan.forEach((text)=>{
                const spanElement = document.createElement('span');
                const clonedNode = text.cloneNode(true) as HTMLElement;

                spanElement.appendChild(clonedNode);
                text.parentNode?.replaceChild(spanElement, text);
                allSpans.push(spanElement)
            })
            const groupedElements = groupElementsByParent(allSpans as HTMLElement[])

            groupedElements.forEach((group, parent) => {
                const rangeWithin = new Range()
                const firstElement = group[0];
                let lastElement = group[group.length-1]
                
                const startContainer = range.startContainer
                const startOffset = range.startOffset
                const isGroupOneElement = firstElement === lastElement

                const rangeToRestore = new SelectionRestorerFromText()
                rangeToRestore.saveRange(range, range.startContainer, range.endContainer)
                    
                const nodeRange = document.createRange();
                

                nodeRange.selectNodeContents(lastElement);
                if (nodeRange.compareBoundaryPoints(Range.END_TO_END, range)>0) {

                    const endRange = new Range()
                    endRange.setStart(range.endContainer, range.endOffset)
                    endRange.setEnd(range.endContainer, range.endOffset)
                    const splitNode = splitNodesInRange(lastElement, endRange)

                    rangeWithin.setEndBefore(splitNode.nodeAfterSplit)
                }else{
                    rangeWithin.setEndAfter(lastElement)
                }
                
                nodeRange.selectNodeContents(firstElement);
                if (nodeRange.compareBoundaryPoints(Range.START_TO_START, range)<0) {
                    if(isGroupOneElement){
                   
                        range.setStart(startContainer, startOffset)
                        range.setEnd(startContainer, startOffset)
                    }
                    const splitNode = splitNodesInRange(firstElement, range)
                     
                    rangeWithin.setStartBefore(splitNode.nodeAfterSplit)
                    if(isGroupOneElement){
                        rangeWithin.setEndAfter(splitNode.nodeAfterSplit)
                    }
                    
                }else{
                    rangeWithin.setStartBefore(firstElement)
                }
                
                    
                const linkElement = document.createElement('a');
                linkElement.href = linkName;
                
                rangeWithin.surroundContents(linkElement);
              })           
        }
        textDocument.saveValue(markdownInput.current!.innerHTML, true, true)
    }

    const createTable = (rows: number, columns: number) => {
        let range = savedSelection;
        range?.setEnd(range.startContainer, range.startOffset)

        if(!range || !markdownInput.current?.contains(range.startContainer)) return  
      
        const parent = getParentNodeWithTag(range.startContainer, ["P", "UL", "OL"])
        let marginLeft = "0pt"
        let marginRight = "0pt"
        if(parent){
            const split = splitNodesInRange(parent, range)
            const computedStyle = getComputedStyle(parent as HTMLElement);
            marginLeft  = computedStyle.marginLeft;
            marginRight  = computedStyle.marginRight;
            
            range.setStartBefore(split.nodeAfterSplit)
            range.setEndBefore(split.nodeAfterSplit)
        }
  
        // Create a new table element
        const container = range.startContainer as HTMLElement
        const containerWidth = container.offsetWidth;

        const table = document.createElement('table');
        const tableWidth = containerWidth - parseFloat(marginLeft) - parseFloat(marginRight)
        table.style.marginLeft = marginLeft
        table.style.marginRight = marginRight
        table.style.border = "1px solid;"
        table.style.borderCollapse = 'collapse'
        table.style.display = "block" // to prevent selection next to table
        const rowWidth = tableWidth/rows;
        // Create table rows
        for (let i = 0; i < rows; i++) {
            const row = table.insertRow();
            row.style.minHeight = "1em"
            row.style.width =  `${rowWidth}px`
            // Create table cells in each row
            for (let j = 0; j < columns; j++) {
                const cell = row.insertCell();
                cell.style.width =  `${rowWidth}px`
                cell.style.border = '1px solid black';
                cell.style.wordBreak = "break-all"
                cell.style.minHeight = "1em"
                cell.style.overflow = "hidden"
                const span = document.createElement('span');
                span.innerHTML = "&#x200b;"
                cell.appendChild(span)
            }
        }     
        // Insert the table into the document
        range?.insertNode(table);
      
        textDocument.saveValue(markdownInput.current!.innerHTML, true, false)
      };

    const updatePageSpan = ({passedRange, callback}:{
        passedRange?: Range|null, 
        callback: (element: HTMLElement) => void
    }) => {
        let selection = window.getSelection()
        if(selection===null) return

        if(markdownInput.current===null) return
        
        let range =  passedRange? passedRange: selection.getRangeAt(0)
        const allSpans = getNodesInRange(range, ["SPAN", "#text"], markdownInput.current!)
        const page = allSpans.find((span)=>(span as HTMLElement).className==="page") as HTMLElement
        callback(page)
        textDocument.saveValue(markdownInput.current!.innerHTML, true, true)
    }

    const deleteSelection = () => {
        const selection = window.getSelection();
        const range = selection!.getRangeAt(0);
        const rangeToRestore = new Range()
        const textNodes = getNodesInRange(range,["#text"] ,markdownInput.current!)
        const imagesNodes = getNodesInRange(range,["IMG"] ,markdownInput.current!)
      
        imagesNodes.forEach((image)=>{
            (image as HTMLElement).remove()
        })

        textNodes.reverse().forEach((node, index)=>{
            const element = node as HTMLElement

            const newText = getTextOutsideRange(node, range)
            
            const columnParent = findColumnParent(node as HTMLElement)
            const selectionStartsAtBeginningOfColumn = columnParent?.firstChild === element || isNestedFirstChild(element, columnParent!) 
            const textIsInTable = node.parentNode?.parentNode?.nodeName === "TD"

            const tableInNotCoveredBySelection = node.parentNode?.parentNode?.parentNode?.parentNode?
             !selection?.containsNode(node.parentNode?.parentNode?.parentNode?.parentNode!): false

            if (selectionStartsAtBeginningOfColumn || (textIsInTable && tableInNotCoveredBySelection )) {
                if(newText.text===""){
                    const parent =  element.parentNode! as HTMLElement
                    parent.innerHTML = "&#x200b;"
                    if(index===0){
                        rangeToRestore.setStart(parent.firstChild!, 1 )
                        rangeToRestore.setEnd(parent.firstChild!, 1 )
                    }
                }
                else{
                    node.textContent = newText.text
                    if(index===0){
                        rangeToRestore.setStart(element, newText.startingPosition )
                        rangeToRestore.setEnd(element, newText.startingPosition )
                    }
                }
            }
            else{
                if(newText.text===""){
                    const elementToDelete = getFurthestDeletableNode(element, columnParent!, range, markdownInput.current!)
                    if(elementToDelete){
                        if(index===0){
                            rangeToRestore.setStartBefore(elementToDelete)
                            rangeToRestore.setEndBefore(elementToDelete)
                            // restore
                        }
                        elementToDelete.remove()
                    }else{
                        node.textContent = newText.text
                    }
                }
                else{
                    node.textContent = newText.text
                    rangeToRestore.setStart(element, newText.startingPosition )
                    rangeToRestore.setEnd(element, newText.startingPosition )
                }
            }
        })
        textDocument.saveValue(markdownInput.current!.innerHTML, true, true);
        selection?.removeAllRanges()
        selection?.addRange(rangeToRestore)
    }
      
    return (
        <EditorContext.Provider value={{spellCheck, scale, fontSize, textBolded, offsetForRuler, markdownInput, showRuler, 
            link, currentPage, paddingBottom, paddingTop,
            textDocument, align, numberedList, bulletedList, marginLeft, marginRight, title, 
            textItalic, textUnderScore, color, backgroundColor, comment, font, savedSelection, documentId: originalDocument._id, columnLayoutOnSelectedPage,
             convertedMarkdown, realDocument: storedInDatabase}}>
            <EditorUpdate.Provider value={{setSpellCheck, setScale, setFontSize, setTextBolded, addLink, updateTitle, restoreSelection,
                    setTextItalic, setTextUnderScore, setColor, addStylingToSpan, updateParagraphs, setAlign, setLink, deleteSelection,
                    setShowRuler, setColumnLayoutOnSelectedPage, updatePageSpan, createTable, addImage, listenToSelectionChanges,
                    setComment, setBackgroundColor, setFont,  setConvertedMarkdown, setOffsetForRuler, addList}}>
                    {children}        
            </EditorUpdate.Provider>
        </EditorContext.Provider>
    )
}




export default Editor;