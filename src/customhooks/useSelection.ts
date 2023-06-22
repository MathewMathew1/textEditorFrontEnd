import { useEffect, useState } from "react";

const useSelection = (ref: React.RefObject<HTMLElement>) => {
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && ref.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      setSavedSelection(range);
    }
  };

  const restoreSelection = () => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      }
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      saveSelection();
    };
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [ref]);

  return {savedSelection, restoreSelection};
};

export default useSelection


