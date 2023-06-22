const highlightText = (htmlString: string,highlightClass = '',markText = 't', matchCase = false):  { highlightedText: string; count: number; } => {
    const regex = /(<\/?[a-z][^>]*>|<!--[\s\S]*?-->)/gi;
    // Split the string by tags
    const parts = htmlString.split(regex);
    let count = 0;
    // Loop over each part and add mark tags to text content only
    const highlightedParts = parts.map((part) => {
        if (part.match(regex)) {
        // Return the HTML tag unchanged
        return part;
        } else {
        // Replace all instances of the mark text with the marked version
      
        const flags = matchCase ? 'g' : 'gi';
        const regex = new RegExp(markText, flags);
        const markedPart = part.replace(regex, (match) => {
            count++;
            return `<mark${highlightClass ? ` class="${highlightClass}"` : ''}>${match}</mark>`;
          });

        return markedPart;
        }
    });
    // Join the parts back together and return the modified string and the count
    return {highlightedText: highlightedParts.join(''), count};
}

const highlightRemover = (htmlString: string, highlightClass = ''): string => {
    const regex = new RegExp(`<mark\\s+class="${highlightClass}"[^>]*>(.*?)<\/mark>`, 'gi');
    return htmlString.replace(regex, '$1');
};

export {highlightRemover, highlightText}