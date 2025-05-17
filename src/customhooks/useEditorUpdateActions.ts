import { useCallback } from "react";
import { getNodesInRange } from "../Utilities/editors";
import { HistoryOfText } from "./useHistorySaver";


export function useEditorUpdateActions(markdownInput: React.RefObject<HTMLElement>, textDocument: HistoryOfText) {
  const updateParagraphs = useCallback(
    ({
      property,
      propertyValue,
      callback,
      passedRange = null,
    }: {
      property: string;
      propertyValue: string;
      callback?: (paragraph: HTMLElement, value: string) => void;
      passedRange?: Range | null;
    }) => {
      const selection = window.getSelection();
      if (!selection && !passedRange) return;

      const range = passedRange ?? selection!.getRangeAt(0);
      const paragraphs = getNodesInRange(range, ["P", "LI", "TABLE"], markdownInput.current!);

      paragraphs.forEach((paragraph) => {
        const element = paragraph as HTMLElement;
        if (callback) {
          callback(element, propertyValue);
        } else {
          element.style[property as any] = propertyValue;
        }
      });

      textDocument.saveValue(markdownInput.current!.innerHTML, true, true);
    },
    [markdownInput]
  );

  const updatePageSpan = useCallback(
    ({
      passedRange,
      callback,
    }: {
      passedRange?: Range | null;
      callback: (element: HTMLElement) => void;
    }) => {
      const selection = window.getSelection();
      if (!selection || !markdownInput.current) return;

      const range = passedRange ?? selection.getRangeAt(0);
      const allSpans = getNodesInRange(range, ["SPAN", "#text"], markdownInput.current);
      const page = allSpans.find((span) => (span as HTMLElement).className === "page") as HTMLElement;

      if (page) callback(page);
      textDocument.saveValue(markdownInput.current.innerHTML, true, true);
    },
    [markdownInput]
  );

  return {
    updateParagraphs,
    updatePageSpan,
  };
}
