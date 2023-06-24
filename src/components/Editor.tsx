
import "./Editor.css";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    SelectionRestorerFromText, getParentNodeWithTag, deleteNode, getNodesInRange, changeTag, getRangeBetweenElements,
    createElementInRange, styleSpans, checkIfAllElementsHaveSameValue, hasAncestorSpan, getInnerRange, splitNodes, getCommonValueForElements, getTextOutsideRange, findColumnParent, getFurthestDeletableNode, isNestedFirstChild, groupElementsByParent, splitNodesInRange
} from "../Utilities/editors";
import "./Editor.css";
import useHistorySaver from "../customhooks/useHistorySaver";
import useSelection from "../customhooks/useSelection";
import { TextDocument } from "../types";
import { useUserUpdate } from "../contexts/UserContext";
import useDebounce from "../customhooks/useDebounce";

const OPPOSITE_VALUES = {
    fontWeight: "normal",
    textDecoration: "none",
    fontStyle: "normal"
}

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

type EditorContextProps = {    
    spellCheck: boolean; 
    marginLeft: string;
    marginRight: string;
    scale: string;
    fontSize: string;
    textBolded: boolean;
    textItalic: boolean;  
    textUnderScore: boolean;
    color: string
    
    comment: boolean
    backgroundColor: string
    font: string
    convertedMarkdown: string
    offsetForRuler: number
    markdownInput: React.RefObject<HTMLDivElement>
    savedSelection: Range | null
    align: string
    realDocument: boolean
    numberedList: boolean
    bulletedList: boolean
    currentPage: number
    documentId: string
    paddingBottom: number
    paddingTop: number
    link: string
    textDocument: {
        value: string;
        saveValue: (newValue: string, changeHistory: boolean, pastedChange: boolean, alwaysOverwrite?: boolean | undefined) => void;
        undo: () => void;
        redo: () => void;
    }
    title: string
    showRuler: boolean
    columnLayoutOnSelectedPage: {
        columns: number;
        currentColumn: number;
        widths: string[];
        currentColumnReference: null | HTMLElement;
    }
}

type EditorUpdateProps = {  
    setSpellCheck: React.Dispatch<React.SetStateAction<boolean>>
    setScale: React.Dispatch<React.SetStateAction<string>>
    updateTitle: (title: string) => void
    setFontSize: React.Dispatch<React.SetStateAction<string>>
    setTextBolded: React.Dispatch<React.SetStateAction<boolean>>
    setTextItalic: React.Dispatch<React.SetStateAction<boolean>>
    setTextUnderScore: React.Dispatch<React.SetStateAction<boolean>>
    setColor: React.Dispatch<React.SetStateAction<string>>
    setComment: React.Dispatch<React.SetStateAction<boolean>>
    setBackgroundColor: React.Dispatch<React.SetStateAction<string>>
    setConvertedMarkdown: React.Dispatch<React.SetStateAction<string>>
    setOffsetForRuler: React.Dispatch<React.SetStateAction<number>>
    setFont: React.Dispatch<React.SetStateAction<string>>
    setAlign: React.Dispatch<React.SetStateAction<string>>
    setShowRuler: React.Dispatch<React.SetStateAction<boolean>>
    setLink: React.Dispatch<React.SetStateAction<string>>
    deleteSelection: () => void
    updatePageSpan: ({ passedRange, callback }: {
        passedRange?: Range | null | undefined;
        callback: (element: HTMLElement) => void;
    }) => void
    addList: (listType: string) => void
    addStylingToSpan: ({ styleProperty, styleValue, haveOppositeValue, callbackFunction }: {
        styleProperty: string;
        styleValue: string;
        haveOppositeValue?: boolean;
        passedRange?: Range|null
        callbackFunction?: (element: HTMLElement, styleProperty: string, styleValue: string, sameValue: boolean) => void | undefined;
    }) => void
    updateParagraphs: ({property, propertyValue, callback, passedRange}:
    {
        property: string, 
        propertyValue: string, 
        callback?: (paragraph: HTMLElement, value: string) => void | undefined ,
        passedRange?: Range|null,
    }) => void
    addLink: ({ linkName, linkText, passedRange }: {
        linkName: string;
        linkText?: string | undefined;
        passedRange?: Range | null;
    }) => void
    setColumnLayoutOnSelectedPage: React.Dispatch<React.SetStateAction<{
        columns: number;
        currentColumn: number;
        widths: string[];
        currentColumnReference: null | HTMLElement;
    }>>
    createTable: (rows: number, columns: number) => void
    addImage: ({ imageUrl, passedRange }: {
        imageUrl: string;
        passedRange?: Range | null | undefined;
    }) => void
    listenToSelectionChanges: () => void
    restoreSelection: () => void
}   

const EditorContext = createContext({} as EditorContextProps)
const EditorUpdate = createContext({} as EditorUpdateProps)


export function useEditor(){
    return useContext(EditorContext)
}

export function useEditorUpdate(){
    return useContext(EditorUpdate)
}


const Editor = ({children, originalDocument, storedInDatabase}:{children: any, originalDocument: TextDocument, storedInDatabase: boolean}) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [title, setTitle] = useState("undefined")
    const [spellCheck, setSpellCheck] = useState(true)
    const [scale, setScale] = useState("100%")
    const [fontSize, setFontSize] = useState("16")
    const [textBolded, setTextBolded] = useState(false)
    const [textItalic, setTextItalic] = useState(false)
    const [textUnderScore, setTextUnderScore] = useState(false)
    const [color, setColor] = useState("rgb(12, 13, 14)")
    const [comment, setComment] = useState(false)
    const [backgroundColor, setBackgroundColor] = useState("rgb(255,255, 255)")
    const [font, setFont] = useState("Open Sans")
    const [link, setLink] = useState("")
    const [convertedMarkdown, setConvertedMarkdown] = useState('');
    const markdownInput = useRef<HTMLDivElement>(null);
    const textDocument = useHistorySaver(originalDocument.text)
    const [offsetForRuler, setOffsetForRuler] = useState(120)
    const {savedSelection, restoreSelection} = useSelection(markdownInput)
    const [align, setAlign] = useState(ALIGN_TYPES.None)
    const [numberedList, setNumberedList] = useState(false)
    const [bulletedList, setBulletedList] = useState(false)
    const [marginLeft, setMarginLeft] = useState("0")
    const [marginRight, setMarginRight] = useState("0")
    const [showRuler, setShowRuler] = useState(true)
    const [paddingBottom, setPaddingBottom] = useState(0)
    const [paddingTop, setPaddingTop] = useState(0)
    const [documentLoaded, setDocumentLoaded] = useState(true)
    const userUpdate = useUserUpdate()

    const onSave = useCallback(() => {
        userUpdate.saveDocument(textDocument.value, originalDocument._id, storedInDatabase);
      },[textDocument.value,originalDocument._id, storedInDatabase])

    const debouncedText = useDebounce(textDocument.value, 1000, onSave);

    const updateTitle = (title: string) => {
        setTitle(title)
        userUpdate.changeTitle(originalDocument._id, title, storedInDatabase)
    }
    
    useEffect(() => {
        userUpdate.saveDocument(debouncedText, originalDocument._id, storedInDatabase)
    }, [debouncedText]);

    

    useEffect(() => {
        setTitle(originalDocument.title)
        textDocument.reset(originalDocument.text)
        document.title = originalDocument.title;
        setDocumentLoaded(false)
    }, [originalDocument._id]);

    useEffect(() => {
       if(documentLoaded===true){
            return
       }
        
        markdownInput.current?.focus()
        // Set any attributes or properties for the element
        const newElement = document.createElement('input');
        newElement.id = 'myElement';
        newElement.type = 'text';

        // Apply CSS styles to make the element invisible
        newElement.style.position = 'absolute';
        newElement.style.top = '-9999px';
        newElement.style.left = '-9999px';

        // Append the element to the desired parent element in the DOM
        const parentElement = document.getElementById('root');
        parentElement!.appendChild(newElement);

        // Focus on the newly created element
        newElement.focus();
        markdownInput.current?.focus()
       setDocumentLoaded(false)
        
    }, [documentLoaded]);

    const [columnLayoutOnSelectedPage, setColumnLayoutOnSelectedPage] = useState<{columns: number, currentColumn: number, widths: string[], currentColumnReference: null|HTMLElement}>
    ({
        columns: 1, 
        currentColumn: 1, 
        currentColumnReference: null,
        widths: ["593mm"]
    })
 
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

    const addStylingToSpan = ({styleProperty, styleValue, haveOppositeValue = false, callbackFunction, passedRange=null}:
        {
            styleProperty: string, 
            styleValue: string, 
            haveOppositeValue?: boolean, 
            passedRange?: Range|null
            callbackFunction?: (element: HTMLElement, styleProperty: string, styleValue: string, sameValue: boolean) => void|undefined
        }) => {
        let selection = window.getSelection()
        if(selection===null) return

        if(markdownInput.current===null) return
        
        const range =  passedRange? passedRange: selection.getRangeAt(0)
        const rangeIsCollapsed = range.collapsed

        const rangeToRestore = new SelectionRestorerFromText()
        const parentNodeOfStart = getParentNodeWithTag(range.startContainer, ["p", "li"])
        const endNodeOfStart = getParentNodeWithTag(range.endContainer, ["p", "li"])
        if(parentNodeOfStart !==null && endNodeOfStart !== null){
            rangeToRestore.saveRange(range, parentNodeOfStart, endNodeOfStart)
        }

        const allSpansAndTextsInsideSelection = getNodesInRange(range, ["SPAN", "#text"], markdownInput.current!)
     
        const allSpansInsideSelection = allSpansAndTextsInsideSelection.filter((node)=>{
            return node.nodeName==="SPAN" && (node as HTMLElement).className !== "page" && (node as HTMLElement).className !== "column"
        })
        const allTextsNotSurroundedWithSpan = allSpansAndTextsInsideSelection.filter((node)=>{
            return node.nodeName==="#text" && !hasAncestorSpan(node)
        })

        if(!haveOppositeValue){
            styleSpans({range, styleProperty, styleValue, allSpansInsideSelection, allowCollapsedRange: rangeIsCollapsed, callbackFunction, sameValues: false })
        }else{
            const allSameValues = checkIfAllElementsHaveSameValue(range, styleProperty, styleValue, allSpansInsideSelection, rangeIsCollapsed )
            styleValue = allSameValues? OPPOSITE_VALUES[styleProperty as keyof typeof OPPOSITE_VALUES] : styleValue
            styleSpans({range, styleProperty, styleValue, allSpansInsideSelection, sameValues: allSameValues, allowCollapsedRange: rangeIsCollapsed, callbackFunction,  })
        }

        allTextsNotSurroundedWithSpan.forEach(textNode => {
            const span = document.createElement('span');
            textNode.parentNode!.insertBefore(span, textNode);
            const rangeWithinText = getInnerRange(textNode, range)
            if(!rangeIsCollapsed && rangeWithinText.collapsed){
                return
            }
            rangeWithinText.surroundContents(span);
            if(callbackFunction){
                callbackFunction(span, styleProperty, styleValue, false)
            }else{
                span.style[styleProperty as any] = styleValue
            }
        })
        
        
        if(!rangeIsCollapsed ){
            rangeToRestore.restoreRange(selection)
        }
        textDocument.saveValue(markdownInput.current?.innerHTML, true, true);
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

    const listenToSelectionChanges = useCallback( () => {
        const selection = window.getSelection();
     
        //if(isSelectionBeforeTable()) return

        if (!selection || !markdownInput.current?.contains(selection.anchorNode)) return
        // updating current values based on selection

        let range = selection.getRangeAt(0)
        const rangeIsCollapsed = range.collapsed

        const allNodes = getNodesInRange(range, ["SPAN", "P", "LI", "OL", "UL", "A", "TABLE"], markdownInput.current!)
        const spans = allNodes.filter(node=>node.nodeName==="SPAN" && (node as HTMLElement).className!=="page" && (node as HTMLElement).className!=="column")
        
        const paragraphs = allNodes.filter(node=>node.nodeName==="P" || node.nodeName==="LI" || node.nodeName==="TABLE")
        const numberedLists = allNodes.filter(node=>node.nodeName==="OL")
        const bulletedLists = allNodes.filter(node=>node.nodeName==="UL")
        const links = allNodes.filter(node=>node.nodeName==="A")

        setTextBolded(checkIfAllElementsHaveSameValue(range, "fontWeight", "bold", spans, rangeIsCollapsed ))
        setTextItalic(checkIfAllElementsHaveSameValue(range, "fontStyle", "italic", spans, rangeIsCollapsed ))
        setTextUnderScore(checkIfAllElementsHaveSameValue(range, "textDecoration", "underline", spans, rangeIsCollapsed ))
        
        const align = getCommonValueForElements(range, "textAlign", paragraphs, rangeIsCollapsed)
        setAlign(align? align: ALIGN_TYPES.None)
        
        const color = getCommonValueForElements(range, "color", spans, rangeIsCollapsed)
        setColor(color? color: DEFAULT_VALUES.Color)
        
        const backgroundColor = getCommonValueForElements(range, "backgroundColor", spans, rangeIsCollapsed)
        setBackgroundColor(backgroundColor? backgroundColor: DEFAULT_VALUES.BackgroundColor)
        
        const fontSize = getCommonValueForElements(range, "fontSize", spans, rangeIsCollapsed)
        setFontSize(fontSize? parseInt(fontSize).toString(): DEFAULT_VALUES.FontSize)
        
        const font = getCommonValueForElements(range, "fontFamily", spans, rangeIsCollapsed)
        const fontFormatted = font? font.replace(/"/g, ''): DEFAULT_VALUES.Font; // removing quotes that exist if font family have spaces
        setFont(fontFormatted)
        
        const isSelectionInsideNumberedList = numberedLists.some((list)=>{
            const selectionIsInsideList = (list===range.startContainer) || list.contains(range.startContainer) && list.contains(range.endContainer)
            return selectionIsInsideList
        }) 
        setNumberedList(isSelectionInsideNumberedList)
 
        const isSelectionInsideBulletedList = bulletedLists.some((list)=>{
            const selectionIsInsideList = (list===range.startContainer) || list.contains(range.startContainer) && list.contains(range.endContainer)
            return selectionIsInsideList
        }) 
        setBulletedList(isSelectionInsideBulletedList)
        if(paragraphs[0]){
            const element = paragraphs[0] as HTMLElement;
            const computedStyle = window.getComputedStyle(element);

            const marginLeft = computedStyle.marginLeft;
            const marginLeftValue = parseInt(marginLeft);
            const marginLeftConverted = isNaN(marginLeftValue) ? '0' : marginLeftValue + 'px';
            setMarginLeft(marginLeftConverted);

            const marginRight = computedStyle.marginRight;
            const marginRightValue = parseInt(marginRight);
            const marginRightConverted = isNaN(marginRightValue) ? '0' : marginRightValue + 'px';
            setMarginRight(marginRightConverted);
        }

        const allPages = Array.from(markdownInput.current.querySelectorAll('span.page'))

        const pageSpan = allPages.find((node)=>selection.containsNode(node, true)) 

        const currentPage = allPages.findIndex((page)=>page===pageSpan)
        
        if(pageSpan){
            const computedStylePage = window.getComputedStyle(pageSpan)
            const paddingBottom = computedStylePage.paddingBottom;
            const paddingBottomConverted = parseFloat(paddingBottom);
            setPaddingBottom(paddingBottomConverted);

            const paddingTop = computedStylePage.paddingTop;
            const paddingTopConverted = parseFloat(paddingTop);
            setPaddingTop(paddingTopConverted);
        }
        
        setCurrentPage(currentPage+1)

        if(pageSpan){
            setColumnLayoutOnSelectedPage(getStatusAboutCurrentColumns(pageSpan, range))
        }
        
        const linkHref = links[0]? (links[0] as HTMLAnchorElement).href: ""
        setLink(linkHref)

    }, [markdownInput.current])
    
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
        textNodes.forEach((node, index)=>{
            const element = node as HTMLElement
            const newText = getTextOutsideRange(node, range)
            
            node.textContent = newText.text
            const columnParent = findColumnParent(node as HTMLElement)
            const selectionStartsAtBeginningOfColumn = columnParent?.firstChild === element || isNestedFirstChild(element, columnParent!) 
            const textIsInTable = node.parentNode?.parentNode?.nodeName === "TD"
            const tableInNotCoveredBySelection = !selection?.containsNode(node.parentNode?.parentNode?.parentNode?.parentNode!)

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
                    }
                }
                else{
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