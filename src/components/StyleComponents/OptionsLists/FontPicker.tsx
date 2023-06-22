import { useEffect } from "react";
import useComponentVisible from "../../../customhooks/useComponentVisiblity";
import useValueHistory from "../../../customhooks/useValueHistory";
import { Fonts } from "../../../types";
import { useEditor, useEditorUpdate } from "../../Editor";
import "./OptionLists.css";

const FontPicker = () => {
    const editorValues = useEditor()
    const editorUpdate = useEditorUpdate()
    const { value, setValue, history } = useValueHistory('Roboto', "fonts");
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible<HTMLDivElement>(false);
    const additionalClass = isComponentVisible? " selected": ""

    useEffect(() => {
        setValue(editorValues.font)
    }, [editorValues.font]);
   
    return (
        <div  className="flex clickable" style={{position: "relative"}} ref={ref}>
            <div className={`${additionalClass}`} onClick={()=>setIsComponentVisible(true)} style={{display: "flex"}}>
                <button  className={`button-select selected-option `}>	{value} </button>
                <div style={{position: "relative", width: "20px"}}>
                    <span className="arrow"/>
                </div>
            </div>
            {isComponentVisible?
                <div  className="dropdown-list box-shadow" style={{position: "absolute", top:"25px"}}>
                    <h3>Lately used:</h3>
                    <ul className="option-list" >
                        {history.map( (value: any,i: any) => 
                            <li className="font-li" 
                                onClick={()=>{setValue(value); editorUpdate.addStylingToSpan({styleProperty: "fontFamily", styleValue: value})}} key={`scale ${i}`}>
                                <div className="option-pick" style={{fontFamily: value, zIndex:100}} >{value}</div>
                            </li>
                            )
                        }   
                    </ul> 
                    <hr/>
                    <ul className="option-list">
                        {Object.values(Fonts).map( (value: any,i: any) => 
                            <li className="font-li" 
                                onClick={()=>{setValue(value); editorUpdate.addStylingToSpan({styleProperty: "fontFamily", styleValue: value}); setIsComponentVisible(false)}} key={`scale ${i}`}>
                                <div style={{fontFamily: value, zIndex:100}} className="option-pick" >{value}</div>
                            </li>
                            )
                        }   
                    </ul>
                </div>
                :
                null 
            }
        </div>
    )
}




export default FontPicker;