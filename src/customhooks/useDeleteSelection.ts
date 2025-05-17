// hooks/useEditorDeleteActions.ts
import { useCallback } from "react";
import { HistoryOfText } from "./useHistorySaver";
import { findColumnParent, getFurthestDeletableNode, getNodesInRange, getTextOutsideRange, isNestedFirstChild } from "../Utilities/editors";


export function useEditorDeleteActions(markdownInput: React.RefObject<HTMLElement>, textDocument: HistoryOfText) {
  const deleteSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !markdownInput.current) return;

    const range = selection.getRangeAt(0);
    const rangeToRestore = new Range();

    const textNodes = getNodesInRange(range, ["#text"], markdownInput.current);
    const imageNodes = getNodesInRange(range, ["IMG"], markdownInput.current);

    imageNodes.forEach((img) => (img as HTMLElement).remove());

    textNodes.reverse().forEach((node, index) => {
      const element = node as HTMLElement;
      const newText = getTextOutsideRange(node, range);
      const columnParent = findColumnParent(element);
      const atColumnStart = columnParent?.firstChild === element || isNestedFirstChild(element, columnParent!);
      const inTable = node.parentNode?.parentNode?.nodeName === "TD";
      const tableNotFullySelected =
        node.parentNode?.parentNode?.parentNode?.parentNode &&
        !selection.containsNode(node.parentNode.parentNode.parentNode.parentNode);

      if (atColumnStart || (inTable && tableNotFullySelected)) {
        if (newText.text === "") {
          const parent = element.parentNode as HTMLElement;
          parent.innerHTML = "&#x200b;";
          if (index === 0) {
            rangeToRestore.setStart(parent.firstChild!, 1);
            rangeToRestore.setEnd(parent.firstChild!, 1);
          }
        } else {
          node.textContent = newText.text;
          if (index === 0) {
            rangeToRestore.setStart(element, newText.startingPosition);
            rangeToRestore.setEnd(element, newText.startingPosition);
          }
        }
      } else {
        if (newText.text === "" &&  markdownInput.current) {
          const toDelete = getFurthestDeletableNode(element, columnParent!, range, markdownInput.current);
          if (toDelete) {
            if (index === 0) {
              rangeToRestore.setStartBefore(toDelete);
              rangeToRestore.setEndBefore(toDelete);
            }
            toDelete.remove();
          } else {
            node.textContent = newText.text;
          }
        } else {
          node.textContent = newText.text;
          rangeToRestore.setStart(element, newText.startingPosition);
          rangeToRestore.setEnd(element, newText.startingPosition);
        }
      }
    });

    textDocument.saveValue(markdownInput.current.innerHTML, true, true);
    selection.removeAllRanges();
    selection.addRange(rangeToRestore);
  }, [markdownInput]);

  return {
    deleteSelection,
  };
}
