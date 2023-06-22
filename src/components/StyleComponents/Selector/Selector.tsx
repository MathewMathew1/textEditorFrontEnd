import React, { useCallback, useState } from "react";
import "./Selector.css";
import { useMemo } from "react";
import { getSaturationCoordinates, parseColor, hslToRgb, clamp, baseHslColor } from "../../../Utilities/colors";
import useOnMouseDown from "../../../customhooks/useOnMouseDown";

const ID = {
  hueSelector: "color-picker-hue",
  saturationSelector: "color-picker-saturation",
}

export const Selector = ({color, changeColor}:{color: string, changeColor:  (r: number, g: number, b: number) => void;}) => {

  const parsedColor = useMemo(() => parseColor(color), [color]);
  const satCoords = useMemo(() => getSaturationCoordinates(parsedColor), [
    parsedColor
  ]);
  const [hueCoords, setHueChanges] = useState(0)
  const [colorIndicator, setColorIndicator] = useState({r:255, g:0, b:0})

  const {mouseDown} = useOnMouseDown()

  const handleHueChange = useCallback(
    (event: any) => {
     
      const { width, left } = document.getElementById(ID.hueSelector)!.getBoundingClientRect();
     
      const xFromTheLeft = clamp(event.clientX - left, 0, width);

      // Value that represent h in HSL
      const hInHsl = Math.round((xFromTheLeft / width) * 360);

      const hsl = { h: hInHsl, s: parsedColor?.hsl.s, l: parsedColor?.hsl.l };
      const rgb = hslToRgb(hsl);
      
      changeColor(rgb.r, rgb.g, rgb.b)
      setHueChanges(xFromTheLeft)
      setColorIndicator(baseHslColor(hsl))
    },
    [parsedColor, mouseDown]
  );

  const handleSaturationMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if(!mouseDown) return
    handleSaturationChange(e)
  }

  const handleHueMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if(!mouseDown) return
    handleHueChange(e)
  }

  const handleSaturationChange = useCallback(
    (event: any) => { 
      const { width, height, left, top } = document.getElementById(ID.saturationSelector)!.getBoundingClientRect();

      const x = clamp(event.clientX - left, 0, width);
      const y = clamp(event.clientY - top, 0, height);
   
      const s = (x / width) * 100;
      const l = 100 - (y / height) * 100;

      const rgb = hslToRgb({ h: parsedColor?.hsl.h, s, l });

      changeColor(rgb.r, rgb.g, rgb.b)

    },
    [parsedColor, mouseDown]
  ); 

  return (
    <div className="cp-free-root">
      <div
        className="cp-saturation"
        id={ID.saturationSelector}
        style={{
          backgroundColor: `hsl(${parsedColor.hsl.h}, 100%, 50%)`
        }}
        onMouseMove={(e)=>handleSaturationMove(e)}
        onClick={(e)=>handleSaturationChange(e)}
      >
        <div
          className="cp-saturation-indicator"
          style={{
            backgroundColor: parsedColor.hex,
            left: (satCoords?.[0] ?? 0) + "%",
            top: (satCoords?.[1] ?? 0) + "%"
          }}
        />
      </div>
      <div  id={ID.hueSelector} className="cp-hue" onClick={(e)=>handleHueChange(e)} onMouseMove={(e)=>handleHueMove(e)}>
        <div
          className="cp-hue-indicator"
          style={{
            backgroundColor: `rgb(${colorIndicator.r}, ${colorIndicator.g}, ${colorIndicator.b})`,
            left: (hueCoords )
          }}
        />
      </div>
    </div>
  );
};