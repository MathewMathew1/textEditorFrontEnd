export interface ColumnLayout {
  columns: number;
  currentColumn: number;
  widths: string[];
  currentColumnReference: HTMLElement | null;
}

export interface EditorState {
  spellCheck: boolean;
  scale: string;
  fontSize: string;
  textBolded: boolean;
  textItalic: boolean;
  textUnderScore: boolean;
  color: string;
  comment: boolean;
  backgroundColor: string;
  font: string;
  link: string;
  convertedMarkdown: string;
  offsetForRuler: number;
  markdownInput: React.RefObject<HTMLDivElement>;
  align: string;
  numberedList: boolean;
  bulletedList: boolean;
  marginLeft: string;
  marginRight: string;
  showRuler: boolean;
  paddingBottom: number;
  paddingTop: number;
  currentPage: number;
  title: string;
  columnLayoutOnSelectedPage: ColumnLayout;
}

export interface EditorUpdate {
  setSpellCheck: React.Dispatch<React.SetStateAction<boolean>>;
  setScale: React.Dispatch<React.SetStateAction<string>>;
  setFontSize: React.Dispatch<React.SetStateAction<string>>;
  setTextBolded: React.Dispatch<React.SetStateAction<boolean>>;
  setTextItalic: React.Dispatch<React.SetStateAction<boolean>>;
  setTextUnderScore: React.Dispatch<React.SetStateAction<boolean>>;
  setColor: React.Dispatch<React.SetStateAction<string>>;
  setComment: React.Dispatch<React.SetStateAction<boolean>>;
  setBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
  setFont: React.Dispatch<React.SetStateAction<string>>;
  setLink: React.Dispatch<React.SetStateAction<string>>;
  setConvertedMarkdown: React.Dispatch<React.SetStateAction<string>>;
  setOffsetForRuler: React.Dispatch<React.SetStateAction<number>>;
  setAlign: React.Dispatch<React.SetStateAction<string>>;
  setShowRuler: React.Dispatch<React.SetStateAction<boolean>>;
  setMarginLeft: React.Dispatch<React.SetStateAction<string>>;
  setMarginRight: React.Dispatch<React.SetStateAction<string>>;
  setPaddingBottom: React.Dispatch<React.SetStateAction<number>>;
  setPaddingTop: React.Dispatch<React.SetStateAction<number>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  setColumnLayoutOnSelectedPage: React.Dispatch<React.SetStateAction<ColumnLayout>>;
  setNumberedList: React.Dispatch<React.SetStateAction<boolean>>;
  setBulletedList: React.Dispatch<React.SetStateAction<boolean>>;
}
