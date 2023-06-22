import { useEffect, useRef, useState } from 'react';
import { ImageResizeInfo } from '../../types';
import { clamp } from '../../Utilities/colors';
import { useEditor } from '../Editor';
import "./ImageResizer.css";

const MINIMAL_IMAGE_WIDTH = 40
const MINIMAL_IMAGE_HEIGHT = 40

interface Props {
    show: boolean;
    imageResizerInfo: ImageResizeInfo
}

const DRAG_DIRECTION = {
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  BOTTOM: "BOTTOM",
  TOP: "TOP",
  TOP_LEFT: "TOP LEFT",
  BOTTOM_LEFT: "BOTTOM LEFT",
  TOP_RIGHT: "TOP RIGHT",
  BOTTOM_RIGHT: "BOTTOM RIGHT",
  ROTATE: "ROTATE",
} as const;

type DragDirection = typeof DRAG_DIRECTION[keyof typeof DRAG_DIRECTION];

const ImageResizer = ({ show, imageResizerInfo }: Props): JSX.Element => {
  const [isBeingRotated, setIsBeingRotated] = useState<boolean>(false);
  const [dragDirection, setDragDirection] = useState<DragDirection>(DRAG_DIRECTION.LEFT)
  const [width, setWidth] = useState<number>(100);
  const [height, setHeight] = useState<number>(100);
  const [startingPosition, setStartingPosition] = useState({top: 0, left: 0, bottom: 0, right: 0, centerX: 0, centerY: 0})
  const [rotateAngle, setRotateAngle] = useState(0)
  const [mousePosition, setMousePosition] = useState({x: 0, y: 0})

  const initialInfo= useRef({initWidth: 0, initHeight: 0, initX: 0, initY: 0, mouseX: 0, mouseY: 0})
  const dragDirectionRef = useRef(dragDirection);
  
  const rectangleRef = useRef<HTMLDivElement>(null)
  const leftBoxRef= useRef<HTMLDivElement>(null)
  const topBoxRef = useRef<HTMLDivElement>(null)
  const wrapperBoxRef = useRef<HTMLDivElement>(null)
  
  const editorValues = useEditor()

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, direction: DragDirection) => {
    e.preventDefault();
    if(direction===DRAG_DIRECTION.ROTATE){
      setIsBeingRotated(true);
    } 
    setDragDirection(direction)
   
    let initX = wrapperBoxRef.current!.offsetLeft;
    let initY = wrapperBoxRef.current!.offsetTop;
    let initWidth = rectangleRef.current!.offsetWidth;
    let initHeight = rectangleRef.current!.offsetHeight;
    initialInfo.current = {initX, initY, initWidth, initHeight, mouseX: e.clientX, mouseY: e.clientY}
    dragDirectionRef.current = direction
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    
    switch (dragDirectionRef.current){
      case(DRAG_DIRECTION.RIGHT):{
        dragResize(e, false, false, true, false)
        break
      }
      case(DRAG_DIRECTION.LEFT):{
        dragResize(e, true, false, true, false)
        break
      }
      case(DRAG_DIRECTION.BOTTOM):{
        dragResize(e, false, false, false, true)
        break
      }
      case(DRAG_DIRECTION.TOP):{
        dragResize(e, false, true, false, true)
        break
      }
      case(DRAG_DIRECTION.TOP_RIGHT):{
        dragResize(e, false, true, true, true)
        break
      }
      case(DRAG_DIRECTION.TOP_LEFT):{
        dragResize(e, true, true, true, true)
        break
      }
      case(DRAG_DIRECTION.BOTTOM_RIGHT):{
        dragResize(e, false, false, true, true)
        break
      }
      case(DRAG_DIRECTION.BOTTOM_LEFT):{
        dragResize(e, true, false, true, true)
        break
      }
      case(DRAG_DIRECTION.ROTATE):{
        const rect = rectangleRef.current;
        if (!rect) return;
        
        const { left, top, width, height } = rectangleRef.current!.getBoundingClientRect();

        const rectCenterX = left + width / 2;
        const rectCenterY = top + height / 2;

        const dx = e.clientX - rectCenterX;
        const dy = e.clientY - rectCenterY;


        const angleRad = Math.atan2(dy,dx) ;
        let angleDeg = (angleRad * 180) / Math.PI + 90;
        if (angleDeg < 0) angleDeg = 360 + angleDeg;

        setRotateAngle(angleDeg);
        setMousePosition({x: e.clientX - left, y: e.clientY - top})
        break
      }
    }
    
  };

  const dragResize = (e: MouseEvent, left: boolean, top: boolean, xResize: boolean, yResize: boolean) => {
    let initRadians = rotateAngle * Math.PI / 180;

    let cosFraction = Math.cos(initRadians);
    let sinFraction = Math.sin(initRadians);

    const wDiff = (e.clientX - initialInfo.current.mouseX);
    const hDiff = (e.clientY - initialInfo.current.mouseY);
    let rotatedWDiff = cosFraction * wDiff + sinFraction * hDiff;
    let rotatedHDiff = cosFraction * hDiff - sinFraction * wDiff;

    let newWidth = initialInfo.current.initWidth
    let newHeight = initialInfo.current.initHeight
    let newX = initialInfo.current.initX
    let newY = initialInfo.current.initY

    if (xResize) {
      if (left) {
          newWidth = initialInfo.current.initWidth - rotatedWDiff;
          newWidth = clamp(newWidth, MINIMAL_IMAGE_WIDTH, 800)
          rotatedWDiff = initialInfo.current.initWidth - newWidth;
          
      } else {
        newWidth = initialInfo.current.initWidth + rotatedWDiff
        newWidth = clamp(newWidth, MINIMAL_IMAGE_WIDTH, 800)
        rotatedWDiff = newWidth - initialInfo.current.initWidth 
         
      }
      newX += 0.5 * rotatedWDiff * cosFraction;
      newY += 0.5 * rotatedWDiff * sinFraction;
    }

    if (yResize) {
      if (top) {
        newHeight = initialInfo.current.initHeight - rotatedHDiff;
        newHeight = clamp(newHeight, MINIMAL_IMAGE_HEIGHT, 800)
        rotatedHDiff = initialInfo.current.initHeight - newHeight;
      } else {
        newHeight = initialInfo.current.initHeight + rotatedHDiff;
        newHeight = clamp(newHeight, MINIMAL_IMAGE_HEIGHT, 800)
        rotatedHDiff = newHeight - initialInfo.current.initHeight
      }
      newX -= 0.5 * rotatedHDiff * sinFraction;
      newY += 0.5 * rotatedHDiff * cosFraction;
    }

    setWidth(newWidth);
    setHeight(newHeight)

    setStartingPosition((startingPosition) => {
      return {...startingPosition, centerX: newX, centerY: newY}
    })
  }

  const handleMouseUp = () => {
    setIsBeingRotated(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    const newWidth = parseInt(rectangleRef.current!.style.width)
    const newHeight = parseInt(rectangleRef.current!.style.height)
    const newRotate = parseInt(wrapperBoxRef.current!.style.rotate)
    
    onResize(newWidth, newHeight, newRotate);
  };


  useEffect(() => {
    setStartingPosition({top: imageResizerInfo.top, left: imageResizerInfo.left, centerX: imageResizerInfo.centerX,
        bottom: imageResizerInfo.bottom, right: imageResizerInfo.right, centerY: imageResizerInfo.centerY})
  }, [imageResizerInfo.top, imageResizerInfo.left,imageResizerInfo.right, imageResizerInfo.bottom, imageResizerInfo.centerX,
      imageResizerInfo.centerY, show]);

  useEffect(() => {
    setWidth(imageResizerInfo.width -1)
    setHeight(imageResizerInfo.height -1)
  }, [imageResizerInfo.height, imageResizerInfo.width, show]);

  useEffect(() => {
    setRotateAngle(imageResizerInfo.rotateDegree)
  }, [imageResizerInfo.rotateDegree, show]);

  const onResize = (width: number, height: number, rotateNumber: number) => {
    const image = imageResizerInfo.image
    image!.style.width = `${width}px`
    image!.style.height = `${height}px`
    image!.style.rotate = `${rotateNumber}deg`
    editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, true)
  }

  return (
    <>
    <div ref={wrapperBoxRef} style={{left: startingPosition.centerX, top: startingPosition.centerY, rotate: rotateAngle + "deg", zIndex: 10}} className='image-resizer-wrapper'>
        <div ref={rectangleRef} className='image-rectangle'
          style={{
            display: show ? 'block' : 'none',              
            width: width + 'px',
            height: height + 'px',      
          }}
        >
          <div onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.TOP_LEFT)} style={{ position: 'absolute', width: '10px', 
            height: '10px', background: 'blue', top: 0, left: 0, cursor: "nwse-resize" }}  />
          <div onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.TOP_RIGHT)} style={{ position: 'absolute', width: '10px', 
            height: '10px', background: 'blue', top: 0, right: 0, cursor: "nesw-resize" }} />
          <div onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.BOTTOM_LEFT)} style={{ position: 'absolute', width: '10px', 
            height: '10px', background: 'blue', bottom: 0, left: 0 , cursor: "nesw-resize"}}  />
          <div onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.BOTTOM_RIGHT)} style={{ position: 'absolute', width: '10px', 
            height: '10px', background: 'blue', bottom: 0, right: 0, cursor: "nwse-resize" }}  />
          <div ref={leftBoxRef} onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.LEFT)}  style={{ position: 'absolute', width: '10px', height: '10px', 
            background: 'blue', top: "50%", left: 0, transform: "translateY(-50%)", cursor: "e-resize" }} />
          <div ref={topBoxRef} onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.TOP)}  style={{ position: 'absolute', width: '10px', 
            height: '10px', background: 'blue', top: 0, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" }}  />
          <div onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.RIGHT)} style={{ position: 'absolute', width: '10px', 
            height: '10px', background: 'blue', top: "50%", right: 0, transform: "translateY(-50%)", cursor: "e-resize" }}  />
          <div onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.BOTTOM)} style={{ position: 'absolute', width: '10px', 
            height: '10px', background: 'blue', bottom: 0, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" }} />
          <div className="circle-rotation-container">
            <div  className="circle-container">
              <div className="rotater-line"></div>
              <div onMouseDown={(e) => handleMouseDown(e, DRAG_DIRECTION.ROTATE)} className="circle-rotater"></div>
            </div>
          </div>
        </div>  
    </div>
    <div  style={{
          position: "absolute",
          left: mousePosition.x, 
          display: isBeingRotated ? 'block' : 'none', 
          fontSize: 10, 
          zIndex: 11,
          top: mousePosition.y}} 
          className='angle-next-to-mouse'>{rotateAngle.toFixed(2)}<sup>0</sup></div>
    </>
  );
}

export default ImageResizer