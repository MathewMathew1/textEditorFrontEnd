
import { EditorState, EditorUpdate } from "../types/editor";
import { changeTag, createElementInRange, deleteNode, getNodesInRange, getParentNodeWithTag, getRangeBetweenElements, getStatusAboutCurrentColumns, SelectionRestorerFromText } from "../Utilities/editors";
import { HistoryOfText } from "./useHistorySaver";

export function useEditorCommands(
  state: EditorState,
  update: EditorUpdate,
  textDocument: HistoryOfText
) {
  const addList = (listType: string) => {
    const selection = window.getSelection();
    if (!selection) return;

    let range = selection.getRangeAt(0);

    const rangeToRestore = new SelectionRestorerFromText();
    const parentNodeOfStart = range.startContainer;
    const parentNodeOfEnd = range.endContainer;
    const endOffset = range.endOffset;
    const startOffset = range.startOffset;
    const spans = getNodesInRange(
      range,
      ["SPAN"],
      state.markdownInput.current!
    );
    const pageSpan = spans.find(
      (node) => (node as HTMLElement).className === "page"
    );
    const columnInfo = getStatusAboutCurrentColumns(pageSpan!, range);

    if (parentNodeOfStart && parentNodeOfEnd)
      rangeToRestore.saveRange(range, parentNodeOfStart, parentNodeOfEnd);

    const parentList = getParentNodeWithTag(range.commonAncestorContainer, [
      "ul",
      "ol",
    ]);
    if (
      columnInfo.currentColumnReference &&
      !columnInfo.currentColumnReference?.contains(parentList)
    )
      parentList === null; // if list in different column ignore it

    if (parentList?.textContent == range.toString()) {
      if (listType.toUpperCase() != parentList.nodeName) {
        changeTag(parentList, listType);
        range.setStart(parentNodeOfStart, startOffset);
        range.setEnd(parentNodeOfEnd, endOffset);
        return;
      }

      const listRange = new Range();
      listRange.setStartBefore(parentList);
      listRange.setEndAfter(parentList);

      const listObject = getNodesInRange(
        range,
        ["LI"],
        state.markdownInput.current!
      ).filter(
        (node) =>
          columnInfo.currentColumnReference?.contains(node) ||
          !columnInfo.currentColumnReference
      );
      listObject.forEach((object) => {
        changeTag(object, "p");
      });
      deleteNode(parentList);

      range.setStart(parentNodeOfStart, startOffset);
      range.setEnd(parentNodeOfEnd, endOffset);
      textDocument.saveValue(state.markdownInput.current!.innerHTML, true, true);
      return;
    }

    if (parentList) {
      const listElements = getNodesInRange(
        range,
        ["LI"],
        state.markdownInput.current!
      ).filter(
        (node) =>
          columnInfo.currentColumnReference?.contains(node) ||
          !columnInfo.currentColumnReference
      );

      const listRange = new Range();
      listRange.setStart(parentList, 0);
      listRange.setEndBefore(listElements[0]);
      if (!listRange.collapsed)
        createElementInRange(parentList.nodeName, listRange);

      const rangeTillTheEndOfList = new Range();
      rangeTillTheEndOfList.setStartAfter(
        listElements[listElements.length - 1]
      );
      rangeTillTheEndOfList.setEnd(parentList, parentList.childNodes.length);
      if (!rangeTillTheEndOfList.collapsed)
        createElementInRange(parentList.nodeName, rangeTillTheEndOfList);

      const rangeForNewList = new Range();
      rangeForNewList.setStartBefore(listElements[0]);
      rangeForNewList.setEndAfter(listElements[listElements.length - 1]);
      if (listType.toUpperCase() != parentList.nodeName) {
        createElementInRange(listType, rangeForNewList);
        deleteNode(parentList);
        range.setStart(parentNodeOfStart, startOffset);
        range.setEnd(parentNodeOfEnd, endOffset);
        textDocument.saveValue(state.markdownInput.current!.innerHTML, true, true);
        return;
      }

      const elementsToChange = getNodesInRange(
        range,
        ["LI"],
        state.markdownInput.current!
      ).filter(
        (node) =>
          columnInfo.currentColumnReference?.contains(node) ||
          !columnInfo.currentColumnReference
      );
      elementsToChange.forEach((elementToChange) => {
        changeTag(elementToChange, "p");
      });

      deleteNode(parentList);

      range.setStart(parentNodeOfStart, startOffset);
      range.setEnd(parentNodeOfEnd, endOffset);
      textDocument.saveValue(state.markdownInput.current!.innerHTML, true, true);
      return;
    }

    const paragraphs = getNodesInRange(
      range,
      ["P", "LI"],
      state.markdownInput.current!
    ).filter((node) => {
      return (
        columnInfo.currentColumnReference?.contains(node) ||
        !columnInfo.currentColumnReference
      );
    });
    let wholeRangeInList = getRangeBetweenElements(
      paragraphs[0],
      paragraphs[paragraphs.length - 1]
    );

    const listsInside = getNodesInRange(
      wholeRangeInList,
      ["OL", "UL"],
      state.markdownInput.current!
    ).filter(
      (node) =>
        columnInfo.currentColumnReference?.contains(node) ||
        !columnInfo.currentColumnReference
    );
    listsInside.forEach((list) => {
      deleteNode(list);
    });
    // range get messed up after deleting lists inside
    wholeRangeInList = getRangeBetweenElements(
      paragraphs[0],
      paragraphs[paragraphs.length - 1]
    );

    const listElement = document.createElement(listType);
    wholeRangeInList.surroundContents(listElement);
    paragraphs.forEach((paragraph) => {
      if (paragraph.nodeName === "li") return;
      changeTag(paragraph, "li");
    });

    range.setStart(parentNodeOfStart, startOffset);
    range.setEnd(parentNodeOfEnd, endOffset);
    textDocument.saveValue(state.markdownInput.current!.innerHTML, true, true);
  };

  return {addList}
}



