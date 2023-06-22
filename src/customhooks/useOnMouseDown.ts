import { useEffect, useState } from "react";

const useOnMouseDown = () => {
    const [mouseDown, setMouseDown] = useState(false);
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
          if (event.button === 0) {
            setMouseDown(true)
          }
        };

        const handleMouseUp = (event: MouseEvent) => {
            if (event.button === 0) {
                setMouseDown(false)
            }
          };
          
        window.addEventListener('mousedown', handleClick); 
        window.addEventListener('mouseup', handleMouseUp);
    
        return () => {
          window.removeEventListener('mousedown', handleClick);
          window.removeEventListener('mouseup', handleMouseUp);
        };
      }, []);

      return {mouseDown}
}
export default useOnMouseDown