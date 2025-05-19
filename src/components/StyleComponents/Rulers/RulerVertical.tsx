import React, { useEffect, useRef, useState } from "react";
import "./RulerVertical.css";
import { clamp } from "../../../Utilities/colors";
import {
  useEditor,
  useEditorUpdate,
} from "../../../contexts/UseEditorProvider";
import { pxToMm } from "../../../Utilities/converters";

const MARGIN_MINIMAL_DISTANCE = 200;

const RulerVertical = () => {
  const [marginStart, setMarginStart] = useState(20);
  const [marginEnd, setMarginEnd] = useState(20);
  const ruler = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const elementRef2 = useRef<HTMLDivElement>(null);

  const editorValues = useEditor();
  const editorUpdate = useEditorUpdate();
  const convertedScale = parseInt(editorValues.scale) / 100;
  const ticks = Array.from(Array(29).keys());

  const changePadding = (padding: number, paddingEnd: boolean) => {
    if (paddingEnd) {
      editorUpdate.updatePageSpan({
        passedRange: editorValues.savedSelection,
        callback: (element) => {
          element.style.paddingBottom = `${padding}mm`;
        },
      });
    } else {
      editorUpdate.updatePageSpan({
        passedRange: editorValues.savedSelection,
        callback: (element) => {
          element.style.paddingTop = `${padding}mm`;
        },
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    let rect = elementRef.current!.getBoundingClientRect();
    let newMargin = clamp(
      pxToMm((e.clientY - rect.top) / convertedScale),
      0,
      pxToMm(ruler.current!.getBoundingClientRect().height) -
        marginEnd -
        MARGIN_MINIMAL_DISTANCE
    );
    setMarginStart(newMargin);
  };

  const handleMouseUp = (e: MouseEvent) => {
    let rect = elementRef.current!.getBoundingClientRect();
    let newMargin = clamp(
      pxToMm((e.clientY - rect.top) / convertedScale),
      0,
      pxToMm(ruler.current!.getBoundingClientRect().height) -
        marginEnd -
        pxToMm(MARGIN_MINIMAL_DISTANCE)
    );
    setMarginStart(newMargin);
    changePadding(newMargin, false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDownEndMargin = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMoveEndMargin);
    document.addEventListener("mouseup", handleMouseUpEndMargin);
  };

  const handleMouseUpEndMargin = (e: MouseEvent) => {
    let rect = elementRef2.current!.getBoundingClientRect();
    let newMargin = clamp(
      pxToMm((rect.bottom - e.clientY) / convertedScale),
      0,
      pxToMm(ruler.current!.getBoundingClientRect().height) -
        marginStart -
       pxToMm( MARGIN_MINIMAL_DISTANCE)
    );
    setMarginEnd(newMargin);

    changePadding(newMargin, true);
    document.removeEventListener("mousemove", handleMouseMoveEndMargin);
    document.removeEventListener("mouseup", handleMouseUpEndMargin);
  };

  const handleMouseMoveEndMargin = (e: MouseEvent) => {
    let rect = elementRef2.current!.getBoundingClientRect();

    let newMargin = clamp(
      pxToMm((rect.bottom - e.clientY) / convertedScale),
      0,
      pxToMm(ruler.current!.getBoundingClientRect().height) -
        marginStart -
        pxToMm(MARGIN_MINIMAL_DISTANCE)
    );

    setMarginEnd(newMargin);
  };

  useEffect(() => {
    setMarginEnd(editorValues.paddingBottom);
  }, [editorValues.paddingBottom]);

  useEffect(() => {
    setMarginStart(editorValues.paddingTop);
  }, [editorValues.paddingTop]);

  return (
    <div
      style={{
        width: ruler.current?.style.width,
        top: `${(editorValues.currentPage - 1) * 297}mm`,
      }}
      className="ruler-container-vertical"
    >
      <div ref={ruler} className="ruler-vertical">
        <div
          onMouseDown={handleMouseDown}
          ref={elementRef}
          className="margin-ruler"
          style={{
            top: "0",
            height: Math.max(marginStart * convertedScale, 1)+"mm",
          }}
        ></div>
        <div
          onMouseDown={handleMouseDownEndMargin}
          ref={elementRef2}
          className="margin-ruler"
          style={{
            bottom: "0",
            height: Math.max(marginEnd * convertedScale, 1)+"mm",
          }}
        ></div>
        {ticks.map((tick) => (
          <div
            key={`cm ${tick}`}
            style={{ height: `${1 * convertedScale}cm` }}
            className="cm"
          >
            <span className="label">{tick}</span>
            <div
              style={{ marginTop: `${3 * convertedScale}mm` }}
              className="mm"
            />
            <div
              style={{ marginTop: `${3 * convertedScale}mm` }}
              className="mm"
            />
          </div>
        ))}
        <div className="cm" style={{ height: `${0.7 * convertedScale}cm` }}>
          <span className="label">{29}</span>
        </div>
      </div>
    </div>
  );
};

export default RulerVertical;
