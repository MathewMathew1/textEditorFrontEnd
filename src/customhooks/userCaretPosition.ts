import { useRef, useEffect, useState } from 'react';

const useCaretPosition = ()  => {
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const divRef = useRef<any>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
        var range = window.getSelection()!.getRangeAt(0);
        var preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(divRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        var start = preSelectionRange.toString().length;

        setSelectionStart(start);
        setSelectionEnd(start+range.toString().length);

      };
  
      document.addEventListener('selectionchange', handleSelectionChange);

      const handle2 = () => {
        var charIndex = 0, range = document.createRange();
        range.setStart(divRef.current, 0);
        range.collapse(true);
        var nodeStack = [divRef.current], node, foundStart = false, stop = false;

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType === 3) {
                var nextCharIndex = charIndex + node.length;
                if (!foundStart && selectionStart >= charIndex && selectionStart <= nextCharIndex) {
                    range.setStart(node, selectionStart - charIndex);
                    foundStart = true;
                }
                if (foundStart && selectionEnd >= charIndex && selectionEnd <= nextCharIndex) {
                    range.setEnd(node, selectionEnd - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            } else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        var sel = window.getSelection();
        sel!.removeAllRanges();
        sel!.addRange(range);
      }

      const observer = new MutationObserver(handle2);
      observer.observe(divRef.current!, {
        childList: true,
        subtree: true,
        characterData: true,
      });

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      observer.disconnect();
    };
  
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [divRef,  window.getSelection()]);

  return {selectionStart, selectionEnd, divRef};
};

export default useCaretPosition;

