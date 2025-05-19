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
import { useEditorDeleteActions } from "../customhooks/useDeleteSelection";

export const ALIGN_TYPES = {
    Center: "center",
    Left: "left",
    Right: "right",
    Justify: "justify",
    None: "none"
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

    const { deleteSelection } = useEditorDeleteActions(markdownInput, textDocument);
      
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