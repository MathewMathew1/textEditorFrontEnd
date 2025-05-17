import { useCallback, useEffect } from "react";

import { useUserUpdate } from "../contexts/UserContext";
import useDebounce from "./useDebounce";

interface DocumentData {
  _id: string;
  title: string;
  text: string;
}

interface TextDocument {
  value: string;
  reset: (text: string) => void;
}

interface UseHandleDocumentProps {
  originalDocument: DocumentData;
  textDocument: TextDocument;
  storedInDatabase: boolean;
  setTitle: (title: string) => void;
  setDocumentLoaded: (loaded: boolean) => void;
}

export default function useHandleDocument({
  originalDocument,
  textDocument,
  storedInDatabase,
  setTitle,
  setDocumentLoaded,
}: UseHandleDocumentProps) {
  const userUpdate = useUserUpdate();

  const onSave = useCallback(() => {
    userUpdate.saveDocument(
      textDocument.value,
      originalDocument._id,
      storedInDatabase
    );
  }, [textDocument.value, originalDocument._id, storedInDatabase]);

  const debouncedText = useDebounce(textDocument.value, 1000, onSave);

  const updateTitle = (title: string): void => {
    setTitle(title);
    userUpdate.changeTitle(originalDocument._id, title, storedInDatabase);
  };

  useEffect(() => {
    userUpdate.saveDocument(
      debouncedText,
      originalDocument._id,
      storedInDatabase
    );
  }, [debouncedText]);

  useEffect(() => {
    setTitle(originalDocument.title);
    textDocument.reset(originalDocument.text);
    document.title = originalDocument.title;
    setDocumentLoaded(false);
  }, [originalDocument._id]);

  return { updateTitle };
}
