import { useState } from "react"
import { Selector } from "./Selector"
import { clamp } from "../../../Utilities/colors"
import { ColorRGB } from "../../../types"

const MAX_RGB_NUMBER = 255

const ColorPicker = ({setValueColor, setShowComponent, showComponent}: 
    {setValueColor: (color: string) => void, 
    setShowComponent: React.Dispatch<React.SetStateAction<boolean>>,
    showComponent: boolean
    }) => {

    const [hexValue, setHexValue] = useState("#ff0000")
    const[rgbValues, setRgbValues] = useState<ColorRGB>({r: 255, g: 255, b: 255})
    const [isHexValueCorrect, setIsHexValueCorrect] = useState(true)
    
    const acceptColor = () => {
        setValueColor(hexValue)
        setShowComponent(false)
    }

    const revertColor = () => {
        setShowComponent(false)
    }

    const changeByHex = (newHexValue: string) => {
        const reg=/^#([0-9a-f]{3}){1,2}$/i

        let val = newHexValue;
        if (val?.slice(0, 1) !== "#") {
            val = "#" + val;
        }

        let correctValue = reg.test(val)

        setIsHexValueCorrect(correctValue)
        setHexValue(val)

        if(correctValue) hexToRgb(val) 
    }

    const hexToRgb = (hex: string) => {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if(result===null) return

        let newRgbValue = {
            r: parseInt(result[1], 16), 
            g: parseInt(result[2], 16), 
            b: parseInt(result[3], 16)
        }
        setRgbValues(newRgbValue)
      }

    const updateRgbValue = (r: number, g: number, b: number) => {
        r = clamp(r, 0, MAX_RGB_NUMBER)
        g = clamp(g, 0, MAX_RGB_NUMBER)
        b = clamp(b, 0, MAX_RGB_NUMBER)

        rgbToHex(r, g, b)
        setIsHexValueCorrect(true)
        setRgbValues({r, g, b})
    }

    function componentToHex(c: number) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    function rgbToHex(r: number, g: number, b: number) {
        setHexValue(`#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`)
    }

    const circleColor = isHexValueCorrect? hexValue: "#ffffff"
    
    return (
        <>
            {showComponent?
                    <div className="color-picker box-shadow" >
                        <Selector color={hexValue} changeColor={updateRgbValue}/>
                        <div className="flex-row">
                            
                            <div className="grid-hex">
                                <div className="circle-area">
                                    <div className="circle" style={{backgroundColor: circleColor}}></div>
                                </div>
                                <div className="pseudo-header">Hex</div>
                                <input prefix ="#" onChange={(e)=>changeByHex(e.target.value)} className="hex-input" style={{width: "4rem"}} value={`${hexValue}`} />
                            </div>

                            <div className="flex-row">
                                <div>
                                    <label htmlFor="input-R">R</label>
                                    <input onChange={(e)=>updateRgbValue(parseInt(e.target.value), rgbValues.g, rgbValues.b)} 
                                        value={rgbValues.r} type="numeric" id="input-R" className="rgb-input"></input>
                                </div>
                                <div>
                                    <label htmlFor="input-G">G</label>
                                    <input onChange={(e)=>updateRgbValue(rgbValues.r, parseInt(e.target.value), rgbValues.b)} 
                                        value={rgbValues.g} type="numeric" id="input-G" className="rgb-input"></input>
                                </div>
                                <div>
                                    <label htmlFor="input-B">B</label>
                                    <input onChange={(e)=>updateRgbValue(rgbValues.r, rgbValues.g, parseInt(e.target.value))} 
                                        value={rgbValues.b} type="numeric" id="input-B" className="rgb-input"></input>
                                </div>
                            </div>
                        </div>
                        <div className="button-group">
                            <button onClick={()=>revertColor()}  className="styled-button wh-btn">Cancel</button> 
                            <button onClick={()=>acceptColor()}  className="styled-button bl-btn">Ok</button>
                        </div>
                    </div>
                :
                    null
            }
        </>
    )
}




export default ColorPicker;