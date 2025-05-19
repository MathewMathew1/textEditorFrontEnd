import { useEffect,  useState } from "react";

interface UseDocumentLoaderProps {
  markdownInput: React.RefObject<HTMLElement>;
}

export default function useDocumentLoader({
  markdownInput
}: UseDocumentLoaderProps) {
    const [documentLoaded, setDocumentLoaded] = useState(true)

  useEffect(() => {
    if (documentLoaded) return;

    // Focus main input
    markdownInput.current?.focus();

    // Create a hidden input and append to DOM
    const newElement = document.createElement("input");
    newElement.id = "myElement";
    newElement.type = "text";
    newElement.style.position = "absolute";
    newElement.style.top = "-9999pt";
    newElement.style.left = "-9999pt";

    const parentElement = document.getElementById("root");
    if (parentElement) {
      parentElement.appendChild(newElement);
      newElement.focus();
    }

    // Refocus markdown input
    markdownInput.current?.focus();


    setDocumentLoaded(false);
  }, [documentLoaded]);

  return {setDocumentLoaded, documentLoaded}
}
