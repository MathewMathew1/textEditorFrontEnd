// src/customhooks/useEditorState.ts
import { useRef, useState } from "react";

export default function useEditorState(originalTitle: string, defaultText: string) {
  const [spellCheck, setSpellCheck] = useState(true);
  const [scale, setScale] = useState("100%");
  const [fontSize, setFontSize] = useState("16");
  const [textBolded, setTextBolded] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderScore, setTextUnderScore] = useState(false);
  const [color, setColor] = useState("rgb(12, 13, 14)");
  const [comment, setComment] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("rgb(255,255, 255)");
  const [font, setFont] = useState("Open Sans");
  const [link, setLink] = useState("");
  const [convertedMarkdown, setConvertedMarkdown] = useState("");
  const [offsetForRuler, setOffsetForRuler] = useState(120);
  const markdownInput = useRef<HTMLDivElement>(null);
  const [align, setAlign] = useState("none");
  const [numberedList, setNumberedList] = useState(false);
  const [bulletedList, setBulletedList] = useState(false);
  const [marginLeft, setMarginLeft] = useState("0");
  const [marginRight, setMarginRight] = useState("0");
  const [showRuler, setShowRuler] = useState(true);
  const [paddingBottom, setPaddingBottom] = useState(0);
  const [paddingTop, setPaddingTop] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [title, setTitle] = useState(originalTitle);

  const [columnLayoutOnSelectedPage, setColumnLayoutOnSelectedPage] = useState({
    columns: 1,
    currentColumn: 1,
    widths: ["593mm"],
    currentColumnReference: null as HTMLElement | null,
  });

  const state = {
    spellCheck,
    scale,
    fontSize,
    textBolded,
    textItalic,
    textUnderScore,
    color,
    comment,
    backgroundColor,
    font,
    link,
    convertedMarkdown,
    offsetForRuler,
    markdownInput,
    align,
    numberedList,
    bulletedList,
    marginLeft,
    marginRight,
    showRuler,
    paddingBottom,
    paddingTop,
    currentPage,
    title,
    columnLayoutOnSelectedPage,
  };

  const update = {
    setSpellCheck,
    setScale,
    setFontSize,
    setTextBolded,
    setTextItalic,
    setTextUnderScore,
    setColor,
    setComment,
    setBackgroundColor,
    setFont,
    setLink,
    setConvertedMarkdown,
    setOffsetForRuler,
    setAlign,
    setShowRuler,
    setMarginLeft,
    setMarginRight,
    setPaddingBottom,
    setPaddingTop,
    setCurrentPage,
    setTitle,
    setColumnLayoutOnSelectedPage,
    setNumberedList,
    setBulletedList
  };

  return { state, update };
}
