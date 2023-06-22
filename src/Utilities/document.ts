const normalParagraph = () => {
    const paragraph = document.createElement('p')
    // Set the margin style
    // Create the span element
    const span = document.createElement('span')
    span.innerHTML = "&#x200b"
    // Append the span element to the paragraph element
    paragraph.appendChild(span)
    return paragraph
}

const areNodesEqual = (node1: HTMLElement, node2: HTMLElement) => {
    // Check if the nodes are of the same type (tag name)
    if (node1.tagName !== node2.tagName) {
      return false
    }
  
    // Get the computed styles of the nodes
    const style1 = node1.style
    const style2 = node2.style

    // Check the number of style properties
    if (style1.length !== style2.length) {
      return false
    }

    // Check each style property
    for (let i = 0; i < style1.length; i++) {
      const property = style1[i]
      if (style2.getPropertyValue(property) !== style1.getPropertyValue(property)) {
        return false
      }
    }
  
    // The nodes are of the same type and have the same styles
    return true
  }

export {normalParagraph, areNodesEqual}