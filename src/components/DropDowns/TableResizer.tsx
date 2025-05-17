import { useEffect, useRef, useState } from 'react';
import { cellResizeInfoType } from '../../types';
import "./TableResizer.css";
import { clamp } from '../../Utilities/colors';
import { useEditor } from '../../contexts/UseEditorProvider';

const MINIMAL_WIDTH = 20
const MINIMAL_HEIGHT = 16

interface Props {
    show: boolean;
    cellInfo: cellResizeInfoType 
}

const DRAG_DIRECTION = {
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  BOTTOM: "BOTTOM",
  TOP: "TOP",

} as const;

type DragDirection = typeof DRAG_DIRECTION[keyof typeof DRAG_DIRECTION];

const TableResizer = ({ show, cellInfo}: Props): JSX.Element => {
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const [right, setRight] = useState(0)
  const [bottom, setBottom] = useState(0)
  const [dragDirection, setDragDirection] = useState<DragDirection>(DRAG_DIRECTION.LEFT)
  const initialCords = useRef({left: 0, top: 0, bottom: 0, right: 0})
  const leftCellLine = useRef<HTMLDivElement>(null)
  const rightCellLine = useRef<HTMLDivElement>(null)
  const topCellLine = useRef<HTMLDivElement>(null)
  const bottomCellLine = useRef<HTMLDivElement>(null)
  const dragDirectionRef = useRef(dragDirection);

  const editorValues = useEditor()

  useEffect(() => {
    setLeft(cellInfo.left)
    setTop(cellInfo.top)
    setRight(cellInfo.right)
    setBottom(cellInfo.bottom)
  }, [cellInfo.left, cellInfo.bottom, cellInfo.top, cellInfo.right]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, direction: DragDirection) => {

    e.preventDefault();
    setDragDirection(direction)
    dragDirectionRef.current = direction

    let initLeft = leftCellLine.current!.getBoundingClientRect().left;
    let initTop = topCellLine.current!.getBoundingClientRect().top;
    let initBottom = bottomCellLine.current!.getBoundingClientRect().top;
    let initRight = rightCellLine.current!.getBoundingClientRect().left;

    initialCords.current = {left: initLeft, top: initTop, right: initRight, bottom: initBottom}

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const convertedScale = parseFloat(editorValues.scale)/100
    if(dragDirectionRef.current===DRAG_DIRECTION.LEFT){
      let newLeft = cellInfo.left + (e.clientX - initialCords.current.left)/convertedScale
      
      const maximalRight = cellInfo.right - MINIMAL_WIDTH
      newLeft = clamp(newLeft, cellInfo.maxLeft, maximalRight) 
      setLeft(newLeft)
    }
    if(dragDirectionRef.current===DRAG_DIRECTION.RIGHT){
      let newRight = cellInfo.right + (e.clientX - initialCords.current.right)/convertedScale
      
      const maximalLeft  = cellInfo.left + MINIMAL_WIDTH
      newRight = clamp(newRight, maximalLeft, cellInfo.maxRight)
      setRight(newRight)
    }
    if(dragDirectionRef.current===DRAG_DIRECTION.BOTTOM){
      let newBottom = cellInfo.bottom + (e.clientY - initialCords.current.bottom)/convertedScale
      
      const maximalTop = cellInfo.top + MINIMAL_HEIGHT
      newBottom = clamp(newBottom, maximalTop, cellInfo.maxBottom)
      setBottom(newBottom)
    }
    if(dragDirectionRef.current===DRAG_DIRECTION.TOP){
      let newTop = cellInfo.top + (e.clientY - initialCords.current.top)/convertedScale

      const maximalBottom = cellInfo.bottom - MINIMAL_HEIGHT
      newTop = clamp(newTop, cellInfo.maxTop, maximalBottom)
      setTop(newTop)
    }
  };

  const changeWidthOfCell = (cell: HTMLTableCellElement, newWidth: number) => {
    const row = cell.parentNode! 
    const rowContainer = row?.parentNode!
    const indexInRow = Array.from(row!.childNodes).findIndex((child)=>child===cell)
    rowContainer.childNodes.forEach((row)=>{
      const nodeAsElement = row.childNodes[indexInRow] as HTMLElement
      nodeAsElement.style.width = `${newWidth}px`

      const cellTakenWidth = dragDirectionRef.current===DRAG_DIRECTION.LEFT? nodeAsElement.previousSibling: nodeAsElement.nextSibling
      if(newWidth>cellInfo.initialWidth && cellTakenWidth){
        const nextNode = cellTakenWidth  as HTMLElement
        const differenceInWidth = newWidth-cellInfo.initialWidth
        const currentWidth = nextNode.offsetWidth;
        nextNode.style.width = `${currentWidth-differenceInWidth}px`
      }
      if(newWidth>cellInfo.initialWidth && row.childNodes.length-1>=indexInRow+1){
        
      }
    })  
    editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, true);
  }

  const changeHeighthOfRow = (cell: HTMLTableCellElement, newHeight: number) => {
    const row = cell.parentNode!
    row.childNodes.forEach((cellInRow)=>{
      const nodeAsElement = cellInRow as HTMLElement
      nodeAsElement.style.height = `${newHeight}px`
    })

    const rowTakenHeight = dragDirectionRef.current===DRAG_DIRECTION.TOP? row.previousSibling: row.nextSibling

    if(rowTakenHeight && newHeight>cellInfo.initialHeight){

      rowTakenHeight.childNodes.forEach((cellInRow)=>{
        const nodeAsElement = cellInRow as HTMLElement
        const currentHeight = nodeAsElement.offsetHeight;
        const differenceInHeight = newHeight-cellInfo.initialHeight

        nodeAsElement.style.height = `${currentHeight-differenceInHeight}px`
      })
    }
    editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, true);
  }

  const handleMouseUp = () => {
    if(dragDirectionRef.current===DRAG_DIRECTION.LEFT || dragDirectionRef.current===DRAG_DIRECTION.RIGHT){
      changeWidthOfCell(cellInfo.cell!, rightCellLine.current!.getBoundingClientRect().left-leftCellLine.current!.getBoundingClientRect().left)
    }else{
      changeHeighthOfRow(cellInfo.cell!, bottomCellLine.current!.getBoundingClientRect().top-topCellLine.current!.getBoundingClientRect().top)
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
    {show?
      <>
        <div ref={leftCellLine} onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.LEFT)}
          style={{height: cellInfo.initialHeight, left, top: cellInfo.top}} className='cell-vertical-line'/>
        <div ref={rightCellLine} onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.RIGHT)}
          style={{height: cellInfo.initialHeight, left: right, top: cellInfo.top}} className='cell-vertical-line'></div>
        <div ref={topCellLine} onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.TOP)}
          style={{width: cellInfo.initialWidth, top, left: cellInfo.left}} className='cell-horizontal-line'></div>
        <div ref={bottomCellLine} onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.BOTTOM)}
          style={{width: cellInfo.initialWidth, top: bottom, left: cellInfo.left}} className='cell-horizontal-line'></div>
      </>
    :
      null
    }
    
    </>
  );
}

export default TableResizer