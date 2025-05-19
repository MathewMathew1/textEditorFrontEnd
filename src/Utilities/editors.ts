class SelectionRestorerFromText {
  public startContainer: Node | undefined;
  public endContainer: Node | undefined;
  public parentNodeStart: Node | undefined;
  public parentNodeEnd: Node | undefined;
  public startOffset: number;
  public endOffset: number;
  public range: Range;
  public isEndContainerSameAsParent: boolean;

  public constructor() {
    this.startContainer;
    this.endContainer;
    this.startOffset = 0;
    this.endOffset = 0;
    this.range = new Range();
    this.isEndContainerSameAsParent = true;
  }

  public saveRange(range: Range, parentNodeStart: Node, parentNodeEnd: Node) {
    this.startContainer = range.startContainer;
    this.endContainer = range.endContainer;
    this.startOffset = range.startOffset;
    this.endOffset = range.endOffset;

    this.parentNodeStart = parentNodeStart;
    this.parentNodeEnd = parentNodeEnd;

    this.getOffset(parentNodeStart, this.startContainer, 0, true);
    if (this.endContainer !== this.parentNodeStart) {
      this.getOffset(parentNodeEnd, this.endContainer, 0, false);
      this.isEndContainerSameAsParent = false;
    }
  }

  public restoreRange(selection: Selection, onlyReturnRange?: boolean) {
    if (this.parentNodeStart === undefined || this.parentNodeEnd === undefined)
      return;
    this.getRange(this.parentNodeStart, 0, true);
    if (this.endContainer !== this.parentNodeStart) {
      this.getRange(this.parentNodeEnd, 0, false);
    } else {
      this.range.setEnd(
        this.parentNodeEnd,
        this.parentNodeEnd.childNodes.length
      );
    }

    if (!onlyReturnRange) {
      selection.removeAllRanges();
      selection.addRange(this.range);
    }

    return this.range;
  }

  private getRange(node: Node, offset: number, startOffset: boolean) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      offset = this.getRange(child, offset, startOffset);
      if (child.nodeType === Node.TEXT_NODE) {
        if (startOffset) {
          if (
            offset + child.textContent!.length >= this.startOffset &&
            offset <= this.startOffset
          ) {
            this.range.setStart(child, this.startOffset - offset);
          }
        } else {
          if (
            offset + child.textContent!.length >= this.endOffset &&
            offset <= this.endOffset
          ) {
            this.range.setEnd(child, this.endOffset - offset);
          }
        }
        offset = offset + child.textContent!.length;
      }
    }
    return offset;
  }

  private getOffset(
    node: Node,
    container: Node,
    offset: number,
    startOffset: boolean
  ) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      offset = this.getOffset(child, container, offset, startOffset);

      if (child !== container) {
        if (child.nodeType === Node.TEXT_NODE) {
          offset += child.textContent!.length;
        }
      } else {
        if (startOffset) {
          this.startOffset = offset + this.startOffset;
        } else {
          this.endOffset = offset + this.endOffset;
        }
      }
    }
    return offset;
  }
}

const getParentNodeWithTag = (node: Node, tags: string[]): Node | null => {
  let currentNode = node;

  while (
    currentNode &&
    !tags.some((value) => value.toUpperCase() === currentNode.nodeName)
  ) {
    currentNode = currentNode.parentNode as Node;
  }

  return currentNode;
};

const deleteAnyChildNodesOfTag = (
  element: Node,
  range: Range,
  tag: string
): boolean => {
  let isChildCoveringWholeText = false;
  for (let i = 0; i < element.childNodes.length; i++) {
    let node = element.childNodes[i];

    let wasChildCoveringWholeText = deleteAnyChildNodesOfTag(node, range, tag);
    if (wasChildCoveringWholeText) {
      isChildCoveringWholeText = true;
    }
    if (node.nodeName === tag.toUpperCase() && range.intersectsNode(node)) {
      if (node.textContent === range.toString()) {
        isChildCoveringWholeText = true;
      }
      deleteNode(node);
    }
  }
  return isChildCoveringWholeText;
};

const deleteNode = (node: Node) => {
  if (node.parentNode) {
    const parent = node.parentNode;
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
  }
};

const splitNodeBetweenRange = (node: Node, range: Range) => {
  const nodeRange = document.createRange();
  nodeRange.selectNodeContents(node);
  const nodeIsPartlyInRange =
    nodeRange.compareBoundaryPoints(Range.START_TO_END, range) > 0 &&
    nodeRange.compareBoundaryPoints(Range.START_TO_START, range) === -1;

  if (nodeIsPartlyInRange) {
    // before
    const rangeOutsideOfRange = document.createRange(); //by outside of range i mean range passed to function
    rangeOutsideOfRange.setStart(node, 0);
    rangeOutsideOfRange.setEnd(range.startContainer, range.startOffset);

    const rangeInsideOfRange = document.createRange();
    rangeInsideOfRange.setStart(range.startContainer, range.startOffset);
    rangeInsideOfRange.setEnd(nodeRange.endContainer, nodeRange.endOffset);

    const nodeAfterRange = node.cloneNode(true);

    const deepestChild = getDeepestNonTextNode(nodeAfterRange) as HTMLElement;
    deepestChild.innerHTML = getRangeInnerHTML(rangeInsideOfRange);

    const convertedNode = node as HTMLElement;
    node.parentNode!.insertBefore(nodeAfterRange, node.nextSibling);
    convertedNode.innerHTML = getRangeInnerHTML(rangeOutsideOfRange);

    return nodeAfterRange;
  }
};

const createRangeFromSelectionEndToNodeEnd = (
  node: Node,
  selection: Selection
) => {
  const firstElement = window.getSelection()?.focusNode as any;

  const newRange = document.createRange();

  newRange.setStart(firstElement, selection.focusOffset);
  newRange.setEnd(node, node.childNodes.length);

  return newRange;
};

const checkIfTextInsideOfTag = (range: Range, tag: string) => {
  let parentNode = range.startContainer.parentNode;
  const selection = window.getSelection();

  if (selection === null) return;

  const firstElement = window.getSelection()?.anchorNode as any;

  if (
    parentNode?.textContent === range.toString() &&
    parentNode?.nodeName === tag.toUpperCase()
  ) {
    deleteNode(parentNode);
    return true;
  }

  while (parentNode) {
    if (parentNode.nodeName === tag.toUpperCase()) {
      if (parentNode?.textContent !== range.toString()) {
        const range2 = new Range();
        // set the start of the range to the start of the node
        range2.setStart(parentNode, 0);
        // set the end of the range to the start of the selection
        range2.setEnd(firstElement, selection.anchorOffset);

        const rangeFromEndOfSelectionToEndOfNode =
          createRangeFromSelectionEndToNodeEnd(parentNode, selection);
        addTagAroundRange(range2, tag);
        addTagAroundRange(rangeFromEndOfSelectionToEndOfNode, tag);
      }

      deleteNode(parentNode);
      return true;
    }
    parentNode = parentNode.parentNode;
  }

  // create a document fragment containing the selected text and its child nodes
  const element = range.commonAncestorContainer;

  const wasTagDeletedHoveringWholeSelection = deleteAnyChildNodesOfTag(
    element,
    range,
    tag
  );

  return wasTagDeletedHoveringWholeSelection;
};

const addTagAroundRange = (range: Range, tag: string) => {
  const elements = range.commonAncestorContainer;

  if (elements.childNodes.length < 1) {
    const tagElement = document.createElement(tag);

    range.surroundContents(tagElement);
    return;
  }

  surroundNodeInRangeWithTag(elements, tag, range);
};

const surroundNodeInRangeWithTag = (
  mainNode: Node,
  tag: string,
  range: Range
) => {
  let nodes = [...mainNode.childNodes];

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i] as Node;

    //  const nodeEndAfterRange = range.comparePoint(node, node.textContent!.length-1) === 1;
    if (node.childNodes.length > 0) {
      surroundNodeInRangeWithTag(node, tag, range);
      continue;
    }
    const newRange = getInnerRange(node, range);
    if (newRange === null || newRange.collapsed) continue;

    const tagElement = document.createElement(tag);
    newRange.surroundContents(tagElement);

    continue;
  }
};

const getInnerRange = (node: Node, range: Range): Range => {
  const innerRange = document.createRange();
  const nodeRange = document.createRange();
  nodeRange.selectNodeContents(node);

  if (range.compareBoundaryPoints(Range.START_TO_START, nodeRange) < 0) {
    innerRange.setStart(nodeRange.startContainer, nodeRange.startOffset);
  } else {
    innerRange.setStart(range.startContainer, range.startOffset);
  }

  if (range.compareBoundaryPoints(Range.END_TO_END, nodeRange) > 0) {
    innerRange.setEnd(nodeRange.endContainer, nodeRange.endOffset);
  } else {
    innerRange.setEnd(range.endContainer, range.endOffset);
  }
  return innerRange;
};

const splitNodes = (node: Node, range: Range) => {
  const nodes = [...node.childNodes];
  for (let i = 0; i < nodes.length; i++) {
    const child = nodes[i];
    if (child.nodeType === Node.TEXT_NODE) continue;

    const splitNode = splitNodeBetweenRange(child, range);
    if (splitNode !== undefined) return splitNode;
  }
};

const splitNodesInRange = (node: Node, range: Range) => {
  const parentCopyClone = node.cloneNode();
  parentCopyClone.textContent = "";
  const childrenOfParent = [...node.childNodes];

  for (let i = 0; i < childrenOfParent.length; i++) {
    const node = childrenOfParent[i];
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);

    const elementIsBeforeRange =
      nodeRange.compareBoundaryPoints(Range.START_TO_END, range) < 0;
    if (elementIsBeforeRange) continue;

    const nodeIsPartlyInRange =
      nodeRange.compareBoundaryPoints(Range.START_TO_END, range) > 0 &&
      nodeRange.compareBoundaryPoints(Range.START_TO_START, range) === -1;

    if (nodeIsPartlyInRange) {
      const copyOfChild = node.cloneNode(true);
      const rangeUntilStartOfSplit = new Range();

      const rangeAfterSplit = new Range();
      rangeAfterSplit.setStart(range.startContainer, range.startOffset);
      rangeAfterSplit.setEndAfter(node);

      const deepestChildOfAfterSplit = getDeepestNonTextNode(
        copyOfChild
      ) as HTMLElement;

      if (deepestChildOfAfterSplit.TEXT_NODE) {
        // it means that node is text
        deepestChildOfAfterSplit.textContent =
          getRangeInnerHTML(rangeAfterSplit);
      } else {
        deepestChildOfAfterSplit.innerHTML = getRangeInnerHTML(rangeAfterSplit);
      }

      rangeUntilStartOfSplit.setStart(node, 0);
      rangeUntilStartOfSplit.setEnd(range.startContainer, range.startOffset);

      const deepestChild = getDeepestNonTextNode(node) as HTMLElement;

      if (deepestChild.TEXT_NODE) {
        // it means that node is text
        deepestChild.textContent = getRangeInnerHTML(rangeUntilStartOfSplit);
      } else {
        deepestChild.innerHTML = getRangeInnerHTML(rangeUntilStartOfSplit);
      }

      parentCopyClone.appendChild(copyOfChild);

      continue;
    }

    node.parentNode?.removeChild(node);
    parentCopyClone.appendChild(node);
  }

  node.parentNode!.insertBefore(parentCopyClone, node.nextSibling);

  return { node, nodeAfterSplit: parentCopyClone };
};

const groupElementsByParent = (
  elements: HTMLElement[]
): Map<HTMLElement | null, HTMLElement[]> => {
  const groupedElements: Map<HTMLElement | null, HTMLElement[]> = new Map();

  for (const element of elements) {
    const parent = element.parentNode as HTMLElement;
    if (parent) {
      if (!groupedElements.has(parent)) {
        groupedElements.set(parent, []);
      }
      groupedElements.get(parent)?.push(element);
    } else {
      if (!groupedElements.has(null)) {
        groupedElements.set(null, []);
      }
      groupedElements.get(null)?.push(element);
    }
  }

  groupedElements.forEach((group, parent) => {
    group.sort((a, b) => {
      const aIndex = Array.from(parent?.childNodes ?? []).indexOf(a);
      const bIndex = Array.from(parent?.childNodes ?? []).indexOf(b);
      return aIndex - bIndex;
    });
  });

  return groupedElements;
};

const createRangeFromNodeAndRange = ({
  range,
  node,
  fromStartOfRange,
}: {
  range: Range;
  node: Node;
  fromStartOfRange: boolean;
}): Range => {
  const nodeRange = document.createRange();
  nodeRange.selectNodeContents(node);

  const newRange = document.createRange();
  if (fromStartOfRange) {
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(nodeRange.endContainer, nodeRange.endOffset);
    return newRange;
  }

  newRange.setStart(nodeRange.startContainer, nodeRange.startOffset);
  newRange.setEnd(range.endContainer, range.endOffset);
  return newRange;
};

const getFurthestParentNodeContainingOnlyText = (node: Node, text: string) => {
  let currentNode = node;

  while (
    currentNode.parentNode &&
    currentNode.parentNode.textContent === text
  ) {
    currentNode = currentNode.parentNode as Node;
  }

  return currentNode;
};

const getNodesInRange = (
  range: Range,
  tagName: string[],
  furthestParentNode: Node
) => {
  let start = range.startContainer;
  let end = range.endContainer;

  let nodes = [];
  let node: Node = start.parentNode as Node;

  // walk parent nodes from start to common ancestor
  for (node; node; node = node.parentNode as Node) {
    if (tagName.some((value) => value === node.nodeName)) {
      nodes.push(node);
    }

    if (node.parentNode == furthestParentNode) break;
  }
  nodes.reverse();

  // walk children and siblings from start until end is found
  for (node = start; node; node = getNextNode(node) as Node) {
    if (
      tagName.some((value) => value === node.nodeName) &&
      range.intersectsNode(node)
    ) {
      nodes.push(node);
    }
  }

  return nodes;
};

function getNextNode(node: Node) {
  if (node.firstChild) return node.firstChild;
  while (node) {
    if (node.nextSibling) return node.nextSibling;
    node = node.parentNode as Node;
  }
}

const changeTag = (element: Node, newTag: string) => {
  let convertedElement = element as HTMLElement;
  let newElement = document.createElement(newTag);

  const childElements = element.childNodes;
  while (childElements.length > 0) {
    newElement.appendChild(childElements[0]);
  }
  for (let i = 0; i < convertedElement.attributes.length; i++) {
    newElement.setAttribute(
      convertedElement.attributes[i].name,
      convertedElement.attributes[i].value
    );
  }
  convertedElement.parentNode!.replaceChild(newElement, element);
};

const getRangeBetweenElements = (startElement: Node, endElement: Node) => {
  const range = new Range();
  range.setStartBefore(startElement);
  range.setEndAfter(endElement);
  return range;
};

const createElementInRange = (tag: string, range: Range) => {
  const listElement2 = document.createElement(tag);
  range.surroundContents(listElement2);
  return listElement2;
};

const isNodeInsideRange = (range: Range, node: Node): boolean => {
  const nodeRange = document.createRange();
  nodeRange.selectNodeContents(node);

  const compareStart = range.compareBoundaryPoints(
    Range.START_TO_START,
    nodeRange
  );
  const compareEnd = range.compareBoundaryPoints(Range.END_TO_END, nodeRange);
  return compareStart <= 0 && compareEnd >= 0;
};

const makeElementHaveSameStyleAsOther = (
  elementRestyled: Node,
  element: Node
) => {
  let convertedElement1 = element as HTMLElement;
  let convertedElement2 = elementRestyled as HTMLElement;

  for (let i = 0; i < convertedElement1.attributes.length; i++) {
    convertedElement2.setAttribute(
      convertedElement1.attributes[i].name,
      convertedElement1.attributes[i].value
    );
  }
};

const styleSpans = ({
  range,
  styleProperty,
  styleValue,
  allSpansInsideSelection,
  sameValues,
  allowCollapsedRange = false,
  callbackFunction,
}: {
  range: Range;
  styleProperty: string;
  sameValues: boolean;
  styleValue: string;
  allSpansInsideSelection: Node[];
  allowCollapsedRange: boolean;
  callbackFunction?: (
    element: HTMLElement,
    styleProperty: string,
    styleValue: string,
    sameValues: boolean
  ) => void | undefined;
}) => {
  allSpansInsideSelection.forEach((element) => {
    let elementConverted = element as HTMLElement;

    if (
      isNodeInsideRange(range, element) ||
      element.textContent === range.toString()
    ) {
      if (callbackFunction) {
        callbackFunction(
          elementConverted as HTMLElement,
          styleProperty,
          styleValue,
          sameValues
        );
      } else {
        elementConverted.style[styleProperty as any] = styleValue;
      }
    } else {
      const miniRangeInside = getInnerRange(element, range);
      if (miniRangeInside.toString() === "" && !allowCollapsedRange) return;

      const rangeInElementTillStartORange = new Range();
      rangeInElementTillStartORange.setStart(element, 0);
      rangeInElementTillStartORange.setEnd(
        miniRangeInside.startContainer,
        miniRangeInside.startOffset
      );

      if (rangeInElementTillStartORange.toString()) {
        const newContent = getRangeInnerHTML(rangeInElementTillStartORange);
        if (newContent) {
          const span = elementConverted.cloneNode(true) as HTMLElement;
     
          span.innerHTML = getRangeInnerHTML(rangeInElementTillStartORange);
          element.parentNode!.insertBefore(span, element);
        }
      }

      const rangeFromStartOfRangeToEndOfElement = new Range();
      rangeFromStartOfRangeToEndOfElement.setStart(
        miniRangeInside.endContainer,
        miniRangeInside.endOffset
      );
      rangeFromStartOfRangeToEndOfElement.setEnd(
        element,
        element.childNodes.length
      );

      const newContentOfSpan = getRangeInnerHTML(
        rangeFromStartOfRangeToEndOfElement
      );
      if (newContentOfSpan !== "") {
        const span = elementConverted.cloneNode(true) as HTMLElement;

        span.innerHTML = newContentOfSpan;
        element.parentNode!.insertBefore(span, element.nextSibling);
      }

      if (callbackFunction) {
        callbackFunction(
          elementConverted as HTMLElement,
          styleProperty,
          styleValue,
          sameValues
        );
      } else {
        elementConverted.style[styleProperty as any] = styleValue;
      }

      // cannnot select empty span by itself
      if (allowCollapsedRange && miniRangeInside.toString() === "") {
        const deepestChild = getDeepestNonTextNode(
          elementConverted
        ) as HTMLElement;
        deepestChild.innerHTML = "&#x200b;";

        let selection = window.getSelection();
        range.setStart(deepestChild.firstChild!, 1);
        range.setEnd(deepestChild.firstChild!, 1); //your position in node
        range.collapse(true);
        selection!.removeAllRanges();
        selection!.addRange(range);
      } else {
        elementConverted.innerHTML = getRangeInnerHTML(miniRangeInside);
      }
    }
  });
};

const getRangeInnerHTML = (range: Range) => {
  var container = document.createElement("div");
  container.appendChild(range.cloneContents());
  return container.innerHTML;
};

const checkIfAllElementsHaveSameValue = (
  range: Range,
  styleProperty: string,
  styleValue: string,
  elements: Node[],
  allowCollapsedRange = false
) => {
  let sameStyleValue = elements.length > 0 ? true : false;
  for (let i = 0; i < elements.length; i++) {
    const miniRangeInside = getInnerRange(elements[i], range);
    if (miniRangeInside.toString() === "" && !allowCollapsedRange) continue;

    let elementConverted = elements[i] as HTMLElement;

    if (elementConverted.style[styleProperty as any] !== styleValue) {
      sameStyleValue = false;
      break;
    }
  }

  return sameStyleValue;
};

const getCommonValueForElements = (
  range: Range,
  styleProperty: string,
  elements: Node[],
  allowCollapsedRange = false
) => {
  let styleValue = null;
  for (let i = 0; i < elements.length; i++) {
    const miniRangeInside = getInnerRange(elements[i], range);
    if (miniRangeInside.toString() === "" && !allowCollapsedRange) continue;

    let elementConverted = elements[i] as HTMLElement;
    const value = elementConverted.style[styleProperty as any];
    if (value === undefined || value === "") {
      return null;
    }
    if (styleValue === null) {
      styleValue = value;
    } else if (styleValue !== value) {
      return null;
    }
  }
  return styleValue;
};

const hasAncestorSpan = (node: Node): boolean => {
  let parentNode = node.parentNode;
  while (parentNode) {
    if (parentNode.nodeName === "SPAN") {
      return true;
    }
    if (parentNode.nodeName === "LI" || parentNode.nodeName === "P")
      return false;
    parentNode = parentNode.parentNode;
  }
  return false;
};

const createRangeFromNode = (node: Node): Range => {
  const range = document.createRange();
  range.selectNode(node);
  return range;
};

const getDeepestNonTextNode = (node: Node) => {
  // Recursively search child nodes
  let deepestChild = node;
  while (deepestChild.hasChildNodes()) {
    if (deepestChild.firstChild?.nodeName === "#text") {
      break;
    }
    deepestChild = deepestChild.firstChild as HTMLElement;
  }

  return deepestChild;
};

const findNodesByTagName = (parentNode: Node, tagName: string) => {
  let nodes: Node[] = [];
  const children = parentNode.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeName.toLowerCase() === tagName.toLowerCase()) {
      nodes.push(child);
    }
    if (child.childNodes.length > 0) {
      nodes = nodes.concat(findNodesByTagName(child, tagName));
    }
  }
  return nodes;
};

function isBrBetweenTextNodes(
  textNode1: Node,
  textNode2: Node,
  rootNode: HTMLElement
): boolean {
  let brFound = false;

  // Find all the siblings of the first text node within their common parent
  let node = textNode1.nextSibling;
  while (node) {
    // Check if the current node is a br tag
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).tagName === "BR"
    ) {
      brFound = true;
      break;
    }

    // Check if the current node is the second text node
    if (node === textNode2) {
      break;
    }

    // Check if the current node is not a text node or an empty text node
    if (node.nodeType !== Node.TEXT_NODE || node.textContent?.trim() === "") {
      break;
    }

    node = node.nextSibling;
  }

  return brFound;
}

const hasTextBetweenNodes = (startNode: Node, endNode: Node): boolean => {
  let foundText = false;
  let currentNode = startNode.nextSibling; // Start with the next sibling of the startNode

  // Loop through the siblings until the endNode is reached
  while (currentNode && currentNode !== endNode) {
    // Check if the current node is a text node with non-empty text content
    if (
      currentNode.nodeType === Node.TEXT_NODE &&
      currentNode.textContent?.trim() !== ""
    ) {
      foundText = true;
      break;
    }
    currentNode = currentNode.nextSibling; // Move to the next sibling
  }

  return foundText;
};

function createLinkFromString(input: string): string {
  const isUrl = /^(https?:\/\/)/i.test(input);
  if (isUrl) {
    // If input is already a URL, return it unchanged
    return input;
  } else {
    // If input is not a URL, prefix it with "https://" and return
    return `https://${input}`;
  }
}

const getFurthestDeletableNode = (
  child: HTMLElement,
  parent: HTMLElement,
  range: Range,
  grandparent: HTMLElement
) => {
  let currentElement = child;
  const nodeRange = document.createRange();
  nodeRange.selectNodeContents(currentElement);
  let nodeIsFullyInRange =
    nodeRange.compareBoundaryPoints(Range.START_TO_START, range) >= 0 &&
    nodeRange.compareBoundaryPoints(Range.END_TO_END, range) === -1;

  if (
    !nodeIsFullyInRange ||
    grandparent === currentElement ||
    currentElement === parent
  )
    return null;

  while (currentElement) {
    nodeRange.selectNodeContents(currentElement.parentNode!);
    nodeIsFullyInRange =
      nodeRange.compareBoundaryPoints(Range.START_TO_START, range) >= 0 &&
      nodeRange.compareBoundaryPoints(Range.END_TO_END, range) === -1;

    const nextELementIsNotDeletable =
      !nodeIsFullyInRange ||
      isNestedFirstChild(currentElement.parentNode! as HTMLElement, parent) ||
      grandparent === currentElement.parentNode ||
      currentElement.parentNode === parent ||
      currentElement.parentNode === null;
    if (nextELementIsNotDeletable) {
      return currentElement;
    }

    currentElement = currentElement.parentNode as HTMLElement;
  }
  return null;
};

const isNestedFirstChild = (
  child: HTMLElement,
  parent: HTMLElement
): boolean => {
  let currentChild = parent;
  while (currentChild) {
    if (currentChild === child) {
      return true;
    }
    currentChild = currentChild.firstChild as HTMLElement;
  }
  return false;
};

const getTextOutsideRange = (
  textNode: Node,
  range: Range
): { text: string; startingPosition: number } => {
  const text = textNode.textContent || "";

  if (!range.intersectsNode(textNode)) {
    return { text, startingPosition: text.length };
  }

  const tempRange = document.createRange();
  tempRange.selectNodeContents(textNode);
  tempRange.setStart(range.endContainer, range.endOffset);
  const textAfterRange = tempRange.toString();

  tempRange.selectNodeContents(textNode);
  tempRange.setEnd(range.startContainer, range.startOffset);
  const textBeforeRange = tempRange.toString();

  return {
    text: textBeforeRange + textAfterRange,
    startingPosition: textBeforeRange.length,
  };
};

const findColumnParent = (element: HTMLElement) => {
  let currentNode = element;

  while (currentNode) {
    if (
      currentNode.nodeName !== "#text" &&
      currentNode.classList.contains("column")
    ) {
      return currentNode;
    }
    currentNode = currentNode.parentNode as HTMLElement;
  }

  return null;
};

const getFirstSpanOfSelectionStart = (): HTMLSpanElement | null => {
  const selection = window.getSelection();

  if (selection) {
    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer as HTMLElement;
    if (startContainer) {
      const firstSpan = startContainer.querySelector("span");

      if (firstSpan instanceof HTMLSpanElement) {
        return firstSpan;
      }
    }
  }
  return null;
};

const getStatusAboutCurrentColumns = (pageSpan: Node, range: Range) => {
  const gridColumnValue = window.getComputedStyle(
    pageSpan as HTMLElement
  ).gridTemplateColumns;
  const gridColumnArray = gridColumnValue.split(" ");
  let currentColumn: null | HTMLElement = null;
  let inWhichColumnSelectionLies = 1;

  for (let i = 0; i < pageSpan.childNodes.length; i++) {
    if (
      range.intersectsNode(pageSpan.childNodes[i]) &&
      (pageSpan.childNodes[i] as HTMLElement).className === "column"
    ) {
      inWhichColumnSelectionLies = i + 1;
      currentColumn = pageSpan.childNodes[i] as HTMLElement;
      break;
    }
  }

  return {
    columns: gridColumnArray.length,
    currentColumn: inWhichColumnSelectionLies,
    widths: gridColumnArray,
    currentColumnReference: currentColumn,
  };
};

export {
  SelectionRestorerFromText,
  getParentNodeWithTag,
  deleteAnyChildNodesOfTag,
  deleteNode,
  getInnerRange,
  isNodeInsideRange,
  splitNodeBetweenRange,
  checkIfTextInsideOfTag,
  addTagAroundRange,
  surroundNodeInRangeWithTag,
  createElementInRange,
  makeElementHaveSameStyleAsOther,
  splitNodes,
  createRangeFromNodeAndRange,
  getFurthestParentNodeContainingOnlyText,
  styleSpans,
  createRangeFromNode,
  findColumnParent,
  getCommonValueForElements,
  hasTextBetweenNodes,
  createLinkFromString,
  getFurthestDeletableNode,
  getTextOutsideRange,
  isNestedFirstChild,
  getNodesInRange,
  changeTag,
  getRangeBetweenElements,
  checkIfAllElementsHaveSameValue,
  hasAncestorSpan,
  splitNodesInRange,
  isBrBetweenTextNodes,
  getFirstSpanOfSelectionStart,
  groupElementsByParent,
  getStatusAboutCurrentColumns
};
