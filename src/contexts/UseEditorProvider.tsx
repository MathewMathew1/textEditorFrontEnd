import { createContext, useContext } from "react";

export type EditorContextProps = {    
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

export type EditorUpdateProps = {  
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

export const EditorContext = createContext({} as EditorContextProps)
export const EditorUpdate = createContext({} as EditorUpdateProps)


export function useEditor(){
    return useContext(EditorContext)
}

export function useEditorUpdate(){
    return useContext(EditorUpdate)
}