
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
import { useEditorCommands } from "../customhooks/useEditorCommands";
import { useEditorUpdateActions } from "../customhooks/useEditorUpdateActions";


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
    const {addList, addImage, addLink, createTable} = useEditorCommands(state, textDocument, savedSelection)

    const { updateParagraphs, updatePageSpan } = useEditorUpdateActions(markdownInput, textDocument);

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