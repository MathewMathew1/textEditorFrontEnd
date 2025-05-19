import { useCallback } from "react";
import {
  checkIfAllElementsHaveSameValue,
  getCommonValueForElements,
  getNodesInRange,
  getStatusAboutCurrentColumns,
} from "../Utilities/editors";
import { EditorUpdate } from "../types/editor";
import { ALIGN_TYPES } from "../components/Editor";
import { pxToMm, pxToPt } from "../Utilities/converters";

interface UseSelectionChangeProps {
  markdownInput: React.RefObject<HTMLElement>;
  setters: EditorUpdate;
}

const DEFAULT_VALUES = {
  Color: "rgb(0,0,0)",
  BackgroundColor: "rgb(255,255,255)",
  FontSize: "12",
  Font: "Times New Roman",
};

export function useHandleSelectionChanges({
  markdownInput,
  setters,
}: UseSelectionChangeProps) {
  

  return useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !markdownInput.current?.contains(selection.anchorNode))
      return;

    const range = selection.getRangeAt(0);
    const rangeIsCollapsed = range.collapsed;

    const allNodes = getNodesInRange(
      range,
      ["SPAN", "P", "LI", "OL", "UL", "A", "TABLE"],
      markdownInput.current
    );
    const spans = allNodes.filter(
      (n) =>
        n.nodeName === "SPAN" &&
        !(n as HTMLElement).classList.contains("page") &&
        !(n as HTMLElement).classList.contains("column")
    );
    const paragraphs = allNodes.filter((n) =>
      ["P", "LI", "TABLE"].includes(n.nodeName)
    );
    const numberedLists = allNodes.filter((n) => n.nodeName === "OL");
    const bulletedLists = allNodes.filter((n) => n.nodeName === "UL");
    const links = allNodes.filter((n) => n.nodeName === "A");

    const getValue = (prop: string, defaultVal: string) =>
      getCommonValueForElements(range, prop, spans, rangeIsCollapsed) ||
      defaultVal;

    setters.setTextBolded(
      checkIfAllElementsHaveSameValue(
        range,
        "fontWeight",
        "bold",
        spans,
        rangeIsCollapsed
      )
    );
    setters.setTextItalic(
      checkIfAllElementsHaveSameValue(
        range,
        "fontStyle",
        "italic",
        spans,
        rangeIsCollapsed
      )
    );
    setters.setTextUnderScore(
      checkIfAllElementsHaveSameValue(
        range,
        "textDecoration",
        "underline",
        spans,
        rangeIsCollapsed
      )
    );

    setters.setAlign(
      getCommonValueForElements(
        range,
        "textAlign",
        paragraphs,
        rangeIsCollapsed
      ) || ALIGN_TYPES.None
    );
    setters.setColor(getValue("color", DEFAULT_VALUES.Color));
    setters.setBackgroundColor(
      getValue("backgroundColor", DEFAULT_VALUES.BackgroundColor)
    );
    setters.setFontSize(
      parseInt( getValue("fontSize", DEFAULT_VALUES.FontSize)).toString()
    );
    setters.setFont(
      getValue("fontFamily", DEFAULT_VALUES.Font).replace(/"/g, "")
    );

    setters.setNumberedList(
      numberedLists.some(
        (list) =>
          list.contains(range.startContainer) &&
          list.contains(range.endContainer)
      )
    );
    setters.setBulletedList(
      bulletedLists.some(
        (list) =>
          list.contains(range.startContainer) &&
          list.contains(range.endContainer)
      )
    );

    if (paragraphs[0]) {
      const style = window.getComputedStyle(paragraphs[0] as HTMLElement);
      setters.setMarginLeft(parseInt(style.marginLeft || "0") + "pt");
      setters.setMarginRight(parseInt(style.marginRight || "0") + "pt");
    }

    const pageSpan = Array.from(
      markdownInput.current.querySelectorAll("span.page")
    ).find((node) => selection.containsNode(node, true));
    if (pageSpan) {
      const style = window.getComputedStyle(pageSpan);
      setters.setPaddingBottom(pxToMm(parseFloat(style.paddingBottom || "0")));
      setters.setPaddingTop(pxToMm( parseFloat(style.paddingTop || "0")));
    }

    const pageIndex = Array.from(
      markdownInput.current.querySelectorAll("span.page")
    ).findIndex((p) => p === pageSpan);
    setters.setCurrentPage(pageIndex + 1);
    if (pageSpan) {
      setters.setColumnLayoutOnSelectedPage(
        getStatusAboutCurrentColumns(pageSpan, range)
      );
    }

    setters.setLink(links[0] ? (links[0] as HTMLAnchorElement).href : "");
  }, [markdownInput.current]);
}


