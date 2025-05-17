import { useCallback } from "react";
import { checkIfAllElementsHaveSameValue, getInnerRange, getNodesInRange, getParentNodeWithTag, hasAncestorSpan, SelectionRestorerFromText, styleSpans } from "../Utilities/editors";
import { HistoryOfText } from "./useHistorySaver";

const OPPOSITE_VALUES = {
    fontWeight: "normal",
    textDecoration: "none",
    fontStyle: "normal"
}

export function useHandleStyling(
  markdownInput: React.RefObject<HTMLElement>,
  textDocument: HistoryOfText
) {
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

  return { addStylingToSpan };
}
