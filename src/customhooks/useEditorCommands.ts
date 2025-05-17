import { EditorState, EditorUpdate } from "../types/editor";
import {
  changeTag,
  createElementInRange,
  deleteNode,
  getNodesInRange,
  getParentNodeWithTag,
  getRangeBetweenElements,
  getStatusAboutCurrentColumns,
  groupElementsByParent,
  SelectionRestorerFromText,
  splitNodes,
  splitNodesInRange,
} from "../Utilities/editors";
import { HistoryOfText } from "./useHistorySaver";

export function useEditorCommands(
  state: EditorState,
  textDocument: HistoryOfText,
  savedSelection: Range | null
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
      textDocument.saveValue(
        state.markdownInput.current!.innerHTML,
        true,
        true
      );
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
        textDocument.saveValue(
          state.markdownInput.current!.innerHTML,
          true,
          true
        );
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
      textDocument.saveValue(
        state.markdownInput.current!.innerHTML,
        true,
        true
      );
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

  const addImage = ({
    imageUrl,
    passedRange,
  }: {
    imageUrl: string;
    passedRange?: Range | null;
  }) => {
    let selection = window.getSelection();
    if (selection === null) return;

    if (state.markdownInput.current === null) return;

    let range = passedRange ? passedRange : selection.getRangeAt(0);
    const parentNodeOfStart = getParentNodeWithTag(range.startContainer, [
      "p",
      "li",
    ])! as HTMLElement;

    const startRange = new Range();
    startRange.setStart(range.startContainer, range.startOffset);
    startRange.setEnd(range.startContainer, range.startOffset);
    let splitNode = splitNodes(parentNodeOfStart, startRange);
    if (splitNode) {
      range.setStartBefore(splitNode);
      range.setEndBefore(splitNode);
    }

    const image = document.createElement("img");
    image.src = imageUrl;
    image.style.maxWidth = "100%";

    range.insertNode(image);
    textDocument.saveValue(state.markdownInput.current!.innerHTML, true, true);
  };

  const addLink = ({
    linkName,
    linkText,
    passedRange = null,
  }: {
    linkName: string;
    linkText?: string | undefined;
    passedRange?: Range | null;
  }) => {
    let selection = window.getSelection();
    if (selection === null) return;

    if (state.markdownInput.current === null) return;

    let range = passedRange ? passedRange : selection.getRangeAt(0);
    const parentNode = getParentNodeWithTag(range.startContainer, ["p", "li"]);

    if (!parentNode) return;
    if (range.toString() === "") {
      const nodeSplit = splitNodes(parentNode, range);
      if (nodeSplit) {
        range.setStartBefore(nodeSplit);
        range.setEndBefore(nodeSplit);
      }
      const link = createElementInRange("a", range);
      link.setAttribute("href", linkName);
      link.textContent = linkText ? linkText : linkName;

      range.setStart(link, 0);
      range.setEnd(link, link.childNodes.length);
      createElementInRange("span", range);

      if (nodeSplit?.textContent === "") deleteNode(nodeSplit);
    } else {
      const allSpansAndText = getNodesInRange(
        range,
        ["SPAN", "#text"],
        state.markdownInput.current!
      );
      const allSpans = allSpansAndText.filter((node) => {
        const element = node as HTMLElement;
        return element.nodeName === "SPAN" && element.classList.length === 0;
      });
      const allTextWithoutSpan = allSpansAndText.filter((element) => {
        return (
          element.nodeName === "#text" &&
          element.parentNode?.nodeName !== "SPAN"
        );
      });
      allTextWithoutSpan.forEach((text) => {
        const spanElement = document.createElement("span");
        const clonedNode = text.cloneNode(true) as HTMLElement;

        spanElement.appendChild(clonedNode);
        text.parentNode?.replaceChild(spanElement, text);
        allSpans.push(spanElement);
      });
      const groupedElements = groupElementsByParent(allSpans as HTMLElement[]);

      groupedElements.forEach((group, parent) => {
        const rangeWithin = new Range();
        const firstElement = group[0];
        let lastElement = group[group.length - 1];

        const startContainer = range.startContainer;
        const startOffset = range.startOffset;
        const isGroupOneElement = firstElement === lastElement;

        const rangeToRestore = new SelectionRestorerFromText();
        rangeToRestore.saveRange(
          range,
          range.startContainer,
          range.endContainer
        );

        const nodeRange = document.createRange();

        nodeRange.selectNodeContents(lastElement);
        if (nodeRange.compareBoundaryPoints(Range.END_TO_END, range) > 0) {
          const endRange = new Range();
          endRange.setStart(range.endContainer, range.endOffset);
          endRange.setEnd(range.endContainer, range.endOffset);
          const splitNode = splitNodesInRange(lastElement, endRange);

          rangeWithin.setEndBefore(splitNode.nodeAfterSplit);
        } else {
          rangeWithin.setEndAfter(lastElement);
        }

        nodeRange.selectNodeContents(firstElement);
        if (nodeRange.compareBoundaryPoints(Range.START_TO_START, range) < 0) {
          if (isGroupOneElement) {
            range.setStart(startContainer, startOffset);
            range.setEnd(startContainer, startOffset);
          }
          const splitNode = splitNodesInRange(firstElement, range);

          rangeWithin.setStartBefore(splitNode.nodeAfterSplit);
          if (isGroupOneElement) {
            rangeWithin.setEndAfter(splitNode.nodeAfterSplit);
          }
        } else {
          rangeWithin.setStartBefore(firstElement);
        }

        const linkElement = document.createElement("a");
        linkElement.href = linkName;

        rangeWithin.surroundContents(linkElement);
      });
    }
    textDocument.saveValue(state.markdownInput.current!.innerHTML, true, true);
  };

  const createTable = (rows: number, columns: number) => {
    let range = savedSelection;
    range?.setEnd(range.startContainer, range.startOffset);

    if (!range || !state.markdownInput.current?.contains(range.startContainer))
      return;

    const parent = getParentNodeWithTag(range.startContainer, [
      "P",
      "UL",
      "OL",
    ]);
    let marginLeft = "0pt";
    let marginRight = "0pt";
    if (parent) {
      const split = splitNodesInRange(parent, range);
      const computedStyle = getComputedStyle(parent as HTMLElement);
      marginLeft = computedStyle.marginLeft;
      marginRight = computedStyle.marginRight;

      range.setStartBefore(split.nodeAfterSplit);
      range.setEndBefore(split.nodeAfterSplit);
    }

    // Create a new table element
    const container = range.startContainer as HTMLElement;
    const containerWidth = container.offsetWidth;

    const table = document.createElement("table");
    const tableWidth =
      containerWidth - parseFloat(marginLeft) - parseFloat(marginRight);
    table.style.marginLeft = marginLeft;
    table.style.marginRight = marginRight;
    table.style.border = "1px solid;";
    table.style.borderCollapse = "collapse";
    table.style.display = "block"; // to prevent selection next to table
    const rowWidth = tableWidth / rows;
    // Create table rows
    for (let i = 0; i < rows; i++) {
      const row = table.insertRow();
      row.style.minHeight = "1em";
      row.style.width = `${rowWidth}px`;
      // Create table cells in each row
      for (let j = 0; j < columns; j++) {
        const cell = row.insertCell();
        cell.style.width = `${rowWidth}px`;
        cell.style.border = "1px solid black";
        cell.style.wordBreak = "break-all";
        cell.style.minHeight = "1em";
        cell.style.overflow = "hidden";
        const span = document.createElement("span");
        span.innerHTML = "&#x200b;";
        cell.appendChild(span);
      }
    }
    // Insert the table into the document
    range?.insertNode(table);

    textDocument.saveValue(state.markdownInput.current!.innerHTML, true, false);
  };

  return { addList, addImage, addLink, createTable };
}
