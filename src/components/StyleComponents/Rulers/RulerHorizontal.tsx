import React, { useEffect, useRef, useState } from "react";
import "./RulerHorizontal.css";
import { clamp } from "../../../Utilities/colors";
import {
  useEditor,
  useEditorUpdate,
} from "../../../contexts/UseEditorProvider";
import { pxToMm } from "../../../Utilities/converters";

const MARGIN_MINIMAL_DISTANCE = 32;
const MINIMAL_COLUMN_WIDTH = 40;
const DRAGGED_ELEMENT_KEYWORDS = {
  marginStart: "marginStart",
  marginEnd: "marginEnd",
  columnStart: "columnStart",
  columnEnd: "columnEnd",
};

const RulerHorizontal = () => {
  const editorValues = useEditor();
  const editorUpdate = useEditorUpdate();
  const [marginStart, setMarginStart] = useState("0");
  const [marginEnd, setMarginEnd] = useState("666mm");
  const [columnWidthStart, setColumnWidthStart] = useState(0);
  const [columnWidthEnd, setColumnWidthEnd] = useState(666);
  const [whichElementIsDragged, setWhichElementIsDragged] =
    useState("marginStart");
  const [isANythingDragged, setIsAnyThingDragged] = useState(false);
  const ruler = useRef<HTMLDivElement>(null);

  const ticks = Array.from(Array(21).keys());
  const convertedScale = parseInt(editorValues.scale) / 100;
  const rulerWidth = ruler.current
    ? ruler.current!.getBoundingClientRect().width / convertedScale
    : 0;

  const dragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const previewElement = document.createElement("div");
    e.dataTransfer.setDragImage(previewElement, 0, 0);
    setIsAnyThingDragged(true);
  };

  const changeMargin = (margin: number, marginEnd: boolean) => {
    editorValues.markdownInput.current!.focus();
    if (marginEnd) {
      editorUpdate.updateParagraphs({
        property: "marginRight",
        propertyValue: `${margin}mm`,
        callback: (element, value) => {
          // update only paragraphs which are in same column as beginning of current selection
          const shouldUpdateElement =
            editorValues.columnLayoutOnSelectedPage.currentColumnReference ===
              null ||
            editorValues.columnLayoutOnSelectedPage.currentColumnReference.contains(
              element
            );
          if (shouldUpdateElement) {
            element.style.marginRight = `${margin}mm`;
            if (element.nodeName === "TABLE") {
            }
          }
        },
      });
    } else {
      editorUpdate.updateParagraphs({
        property: "marginLeft",
        propertyValue: `${margin}mm`,
        callback: (element, value) => {
          const shouldUpdateElement =
            editorValues.columnLayoutOnSelectedPage.currentColumnReference ===
              null ||
            editorValues.columnLayoutOnSelectedPage.currentColumnReference.contains(
              element
            );
          if (shouldUpdateElement) {
            element.style.marginLeft = `${margin}mm`;
          }
        },
      });
    }
  };

  const finishDragStartMargin = (e: React.DragEvent<HTMLDivElement>) => {
    let widthBefore = 0;
    for (
      let i = 0;
      i < editorValues.columnLayoutOnSelectedPage.currentColumn - 1;
      i++
    ) {
      widthBefore =
        widthBefore +
        parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }
    const newMargin = clamp(
      pxToMm((e.clientX - editorValues.offsetForRuler) / convertedScale),
      pxToMm(widthBefore),
      parseInt(marginEnd) - MARGIN_MINIMAL_DISTANCE
    );
    setMarginStart(`${newMargin}mm`);
    changeMargin(newMargin - pxToMm(widthBefore), false);
    setIsAnyThingDragged(false);
  };

  const finishDragEndMargin = (e: React.DragEvent<HTMLDivElement>) => {
    let widthUntilEndOFColumn = 0;
    for (
      let i = 0;
      i < editorValues.columnLayoutOnSelectedPage.currentColumn;
      i++
    ) {
      widthUntilEndOFColumn =
        widthUntilEndOFColumn +
        parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }
    const newMargin = clamp(
      (e.clientX - editorValues.offsetForRuler) / convertedScale,
      parseInt(marginStart) + MARGIN_MINIMAL_DISTANCE,
      widthUntilEndOFColumn
    );
    setMarginEnd(`${pxToMm(newMargin)}mm`);
    changeMargin(pxToMm(widthUntilEndOFColumn - newMargin), true);
    setIsAnyThingDragged(false);
  };

  const onDragStartMargin = (e: React.DragEvent<HTMLDivElement>) => {
    let widthBefore = 0;
    for (let i = 0; i < editorValues.columnLayoutOnSelectedPage.currentColumn - 1;i++) {
      widthBefore = widthBefore + parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }
    console.log(widthBefore)
    console.log((e.clientX - editorValues.offsetForRuler) / convertedScale)
    const newMargin = clamp(
      pxToMm((e.clientX - editorValues.offsetForRuler) / convertedScale),
      pxToMm(widthBefore),
      parseInt(marginEnd) - MARGIN_MINIMAL_DISTANCE
    );

    setMarginStart(`${newMargin}mm`);
  };

  const onDragEndMargin = (e: React.DragEvent<HTMLDivElement>) => {
    let widthUntilEndOFColumn = 0;
    for (
      let i = 0;
      i < editorValues.columnLayoutOnSelectedPage.currentColumn;
      i++
    ) {
      widthUntilEndOFColumn =
        widthUntilEndOFColumn +
        parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }
    const newMargin = clamp(
      pxToMm((e.clientX - editorValues.offsetForRuler) / convertedScale),
      pxToMm(parseInt(marginStart) + MARGIN_MINIMAL_DISTANCE),
      widthUntilEndOFColumn
    );
    setMarginEnd(`${newMargin}mm`);
  };

  const onDragEndWidth = (e: React.DragEvent<HTMLDivElement>) => {
    let widthBefore = 0;
    let { currentColumn } = editorValues.columnLayoutOnSelectedPage;
    for (let i = 0; i < currentColumn - 1; i++) {
      widthBefore = parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }

    let widthAfter = 0;
    if (
      editorValues.columnLayoutOnSelectedPage.currentColumn === 1 &&
      editorValues.columnLayoutOnSelectedPage.columns === 3
    ) {
      widthAfter = parseInt(editorValues.columnLayoutOnSelectedPage.widths[2]);
    }

    const newWidth = clamp(
      (e.clientX - editorValues.offsetForRuler) / convertedScale,
      MINIMAL_COLUMN_WIDTH + widthBefore,
      rulerWidth - widthAfter - MINIMAL_COLUMN_WIDTH
    );
    setColumnWidthEnd(pxToMm(newWidth));
  };

  const onDragStartWidth = (e: React.DragEvent<HTMLDivElement>) => {
    let widthBeforeLeftNeighborColumn = 0;
    let { currentColumn } = editorValues.columnLayoutOnSelectedPage;
    for (let i = 0; i < currentColumn - 2; i++) {
      widthBeforeLeftNeighborColumn =
        widthBeforeLeftNeighborColumn +
        parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }

    const newWidth = clamp(
      pxToMm((e.clientX - editorValues.offsetForRuler) / convertedScale),
      pxToMm(MINIMAL_COLUMN_WIDTH + widthBeforeLeftNeighborColumn),
      columnWidthEnd - MINIMAL_COLUMN_WIDTH
    );

    setColumnWidthStart(newWidth);
  };

  const onFinishDragStartWidth = (e: React.DragEvent<HTMLDivElement>) => {
    let widthBeforeLeftNeighborColumnPx = 0;
    let { currentColumn } = editorValues.columnLayoutOnSelectedPage;

    for (let i = 0; i < currentColumn - 2; i++) {
      widthBeforeLeftNeighborColumnPx += parseInt(
        editorValues.columnLayoutOnSelectedPage.widths[i]
      );
    }

    const mouseX = pxToMm(
      (e.clientX - editorValues.offsetForRuler) / convertedScale
    );
    const minWidthPx = pxToMm(
      MINIMAL_COLUMN_WIDTH + widthBeforeLeftNeighborColumnPx
    );
    const maxWidthPx = columnWidthEnd - MINIMAL_COLUMN_WIDTH;

    const newWidthPx = clamp(mouseX, minWidthPx, maxWidthPx);

    const columnsWidthPx: number[] = [];

    if (currentColumn === 2) {
      columnsWidthPx.push(newWidthPx);
      columnsWidthPx.push(columnWidthEnd - newWidthPx);
      if (editorValues.columnLayoutOnSelectedPage.columns === 3) {
        columnsWidthPx.push(
          parseInt(editorValues.columnLayoutOnSelectedPage.widths[2])
        );
      }
    } else {
      const firstColWidthPx = parseInt(
        editorValues.columnLayoutOnSelectedPage.widths[0]
      );
      columnsWidthPx.push(firstColWidthPx);
      columnsWidthPx.push(newWidthPx - firstColWidthPx);
      columnsWidthPx.push(columnWidthEnd - newWidthPx);
    }

    setColumnWidthStart(newWidthPx);

    const newColumnsWidthCss = columnsWidthPx.map((w) => `${w}mm`).join(" ");
   
    editorUpdate.updatePageSpan({
      passedRange: editorValues.savedSelection,
      callback: (element) => {
        element.style.gridTemplateColumns = newColumnsWidthCss;
      },
    });

    setIsAnyThingDragged(false);
  };

  const onFinishDragEndWidth = (e: React.DragEvent<HTMLDivElement>) => {
    let widthBefore = 0;
    let { currentColumn } = editorValues.columnLayoutOnSelectedPage;
    for (let i = 0; i < currentColumn - 1; i++) {
      widthBefore = parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }
    let widthAfter = 0;
    if (
      editorValues.columnLayoutOnSelectedPage.currentColumn === 1 &&
      editorValues.columnLayoutOnSelectedPage.columns === 3
    ) {
      widthAfter = parseInt(editorValues.columnLayoutOnSelectedPage.widths[2]);
    }

    const newWidth = clamp(
      (e.clientX - editorValues.offsetForRuler) / convertedScale,
      MINIMAL_COLUMN_WIDTH + widthBefore,
      rulerWidth - widthAfter - MINIMAL_COLUMN_WIDTH
    );

    const columnsWidth: number[] = [];

    if (currentColumn === 1) {
      columnsWidth.push(pxToMm(newWidth));
      if (editorValues.columnLayoutOnSelectedPage.columns === 3) {
        columnsWidth.push(
          pxToMm(
            rulerWidth -
              parseInt(editorValues.columnLayoutOnSelectedPage.widths[2]) -
              newWidth
          )
        );
        columnsWidth.push(
          pxToMm(parseInt(editorValues.columnLayoutOnSelectedPage.widths[2]))
        );
      } else {
        columnsWidth.push(pxToMm(rulerWidth - newWidth));
      }
    } else {
      columnsWidth.push(
        pxToMm(parseInt(editorValues.columnLayoutOnSelectedPage.widths[0]))
      );
      columnsWidth.push(pxToMm(newWidth - columnsWidth[0]));
      columnsWidth.push(
        pxToMm(
          ruler.current!.getBoundingClientRect().width -
            columnsWidth[0] -
            columnsWidth[1]
        )
      );
    }
    const newColumnsWidth = columnsWidth.join("mm ") + "mm";

    setColumnWidthEnd(newWidth);
    editorUpdate.updatePageSpan({
      passedRange: editorValues.savedSelection,
      callback: (element) => {
        element.style.gridTemplateColumns = newColumnsWidth;
      },
    });
    setIsAnyThingDragged(false);
  };

  const draggedLinePosition = () => {
    if (whichElementIsDragged === DRAGGED_ELEMENT_KEYWORDS.marginStart)
      return parseInt(marginStart) * convertedScale;
    if (whichElementIsDragged === DRAGGED_ELEMENT_KEYWORDS.marginEnd)
      return parseInt(marginEnd) * convertedScale;
    if (whichElementIsDragged === DRAGGED_ELEMENT_KEYWORDS.columnEnd)
      return columnWidthEnd * convertedScale;
    if (whichElementIsDragged === DRAGGED_ELEMENT_KEYWORDS.columnStart)
      return columnWidthStart * convertedScale;
  };

  useEffect(() => {
    let widthBefore = 0;
    for (
      let i = 0;
      i < editorValues.columnLayoutOnSelectedPage.currentColumn - 1;
      i++
    ) {
      widthBefore =
        widthBefore +
        parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }

    setMarginStart(
      `${pxToMm(parseInt(editorValues.marginLeft) + widthBefore)}`
    );
  }, [editorValues.marginLeft, editorValues.columnLayoutOnSelectedPage]);

  useEffect(() => {
    let widthUntilEndOFColumn = 0;
    for (
      let i = 0;
      i < editorValues.columnLayoutOnSelectedPage.currentColumn;
      i++
    ) {
      widthUntilEndOFColumn =
        widthUntilEndOFColumn +
        parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }
    const newMargin =
      widthUntilEndOFColumn - parseInt(editorValues.marginRight);

    setMarginEnd(`${pxToMm(newMargin)}mm`);
  }, [editorValues.marginRight, editorValues.columnLayoutOnSelectedPage]);

  useEffect(() => {
    let start = 0;
    let { currentColumn } = editorValues.columnLayoutOnSelectedPage;
    for (let i = 0; i < currentColumn - 1; i++) {
      start =
        start + parseInt(editorValues.columnLayoutOnSelectedPage.widths[i]);
    }

    let end =
      start +
      parseInt(
        editorValues.columnLayoutOnSelectedPage.widths[currentColumn - 1]
      );

    setColumnWidthStart(pxToMm(start));
    setColumnWidthEnd(pxToMm(end));
  }, [editorValues.columnLayoutOnSelectedPage]);

  const startConverted = parseInt(marginStart) * convertedScale;
  const endConverted = parseInt(marginEnd) * convertedScale;

  return (
    <div
      style={{ width: ruler.current?.style.width }}
      className="ruler-container"
    >
      <div
        ref={ruler}
        style={{ marginLeft: `${editorValues.offsetForRuler}px` }}
        className="ruler"
      >
        {editorValues.columnLayoutOnSelectedPage.currentColumn !== 1 ? (
          <div
            style={{ left: `${columnWidthStart * convertedScale}mm` }}
            className="blue-square"
            onDragCapture={(e) => onDragStartWidth(e)}
            onDragEnd={(e) => onFinishDragStartWidth(e)}
            draggable={true}
            onDragStart={(e) => {
              dragStart(e);
              setWhichElementIsDragged(DRAGGED_ELEMENT_KEYWORDS.columnStart);
            }}
          ></div>
        ) : null}
        {editorValues.columnLayoutOnSelectedPage.currentColumn !==
        editorValues.columnLayoutOnSelectedPage.columns ? (
          <div
            style={{ left: `${columnWidthEnd * convertedScale}mm` }}
            className="blue-square"
            onDragCapture={(e) => onDragEndWidth(e)}
            onDragEnd={(e) => onFinishDragEndWidth(e)}
            draggable={true}
            onDragStart={(e) => {
              dragStart(e);
              setWhichElementIsDragged(DRAGGED_ELEMENT_KEYWORDS.columnEnd);
            }}
          ></div>
        ) : null}
        <div
          style={{ left: `${startConverted}mm` }}
          className="blue-triangle"
          onDragCapture={(e) => onDragStartMargin(e)}
          onDragEnd={(e) => finishDragStartMargin(e)}
          draggable={true}
          onDragStart={(e) => {
            dragStart(e);
            setWhichElementIsDragged(DRAGGED_ELEMENT_KEYWORDS.marginStart);
          }}
        ></div>
        <div
          style={{ left: `${endConverted}mm` }}
          className="blue-triangle"
          onDragCapture={(e) => onDragEndMargin(e)}
          onDragEnd={(e) => finishDragEndMargin(e)}
          draggable={true}
          onDragStart={(e) => {
            dragStart(e);
            setWhichElementIsDragged(DRAGGED_ELEMENT_KEYWORDS.marginEnd);
          }}
        ></div>

        {isANythingDragged ? (
          <div
            style={{ left: `${draggedLinePosition()}mm` }}
            className="blue-line"
          ></div>
        ) : null}
        {ticks.map((tick) => (
          <div
            key={`cm ${tick}`}
            style={{ width: `${1 * (parseInt(editorValues.scale) / 100)}cm` }}
            className="cm"
          >
            <span className="label">{tick}</span>
            <div
              style={{
                marginLeft: `${3 * (parseInt(editorValues.scale) / 100)}mm`,
              }}
              className="mm"
            />
            <div
              style={{
                marginLeft: `${3 * (parseInt(editorValues.scale) / 100)}mm`,
              }}
              className="mm"
            />
          </div>
        ))}
        <div className="cm" style={{ width: 0 }}>
          <span className="label">21</span>
        </div>
      </div>
    </div>
  );
};

export default RulerHorizontal;
