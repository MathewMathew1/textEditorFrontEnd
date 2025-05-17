import { useState } from "react";
import useComponentVisible from "../../../customhooks/useComponentVisiblity";
import "./OptionLists.css";
import { useEditor, useEditorUpdate } from "../../..//contexts/UseEditorProvider";
import "./FormatPicker.css";

type option = {
    name: string,
    tag: string,

}

const STYLE_OPTIONS = {
    title: {
        name: "Title",
        style: {
            fontSize: `3rem`,
            fontWeight: "700",
            lineHeight: 1,
        }
    },
    normal: {
        name: "Normal",
        style: {
            fontSize: `1rem`,
            fontWeight: "450",
            lineHeight: 1,
        }
    },
    subTitle: {
        name: "Subtitle",
        style: {
            fontSize: "2rem",
            lineHeight: "1",
        }
    },
    heading: {
        name: "Heading",
        style: {
            fontSize: `2.5rem`,
            fontWeight: "600",
            lineHeight: 1,
        }
    },
    heading2: {
        name: "Heading2",
        style: {
            fontSize: `2rem`,
            fontWeight: "600",
            lineHeight: 1,
        }
    },
    heading3: {
        name: "Heading3",
        style: {
            fontSize: `1.5rem`,
            fontWeight: "600",
        }
    }
}

const FormatPicker = () => {
    const [format, setFormat] = useState<any>(STYLE_OPTIONS.normal);
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible<HTMLDivElement>(false);
    const additionalClass = isComponentVisible? " selected": ""
    const editorUpdate = useEditorUpdate()

    const applyFormatting = (key: string) => {
        const pickedStyle = STYLE_OPTIONS[key as keyof typeof STYLE_OPTIONS]
        setFormat(pickedStyle)
        editorUpdate.updateParagraphs({property: "style", propertyValue: key, callback: callbackApplyChanges})
        setIsComponentVisible(false)
    }

    const callbackApplyChanges = (paragraph: HTMLElement, value: string) => {
        const pickedStyle = STYLE_OPTIONS[value as keyof typeof STYLE_OPTIONS]
        for (const key in pickedStyle.style) {

            paragraph.style[key as any] = pickedStyle.style[key as keyof typeof pickedStyle.style]
        }
        
    }

    return (
        <div onClick={()=>setIsComponentVisible(true)} className="flex clickable" style={{position: "relative"}} ref={ref}>
            <div className={`${additionalClass}`} style={{display: "flex"}}>
                <button className={`button-select selected-option ${additionalClass}`}>	{format.name} </button>
                <div style={{position: "relative", width: "20px"}}>
                    <span className="arrow"/>
                </div>
            </div>
            {isComponentVisible?
                <div  className="dropdown-list box-shadow" style={{position: "absolute", top:"25px"}}>
                    <ul className="option-list" >
                        {Object.keys(STYLE_OPTIONS).map( (key: string,i: any) => {
                            let styleObject = STYLE_OPTIONS[key as keyof typeof STYLE_OPTIONS]
                            return(
                                <li className="format-option-style" style={styleObject.style} onClick={()=>{applyFormatting(key); setIsComponentVisible(false)}}   key={`scale ${i}`}>
                                    <div style={{zIndex:100}} className="option-pick" >{styleObject.name}</div>
                                </li> 
                            ) 
                        })}   
                    </ul> 
                </div>
                :
                null 
            }
        </div>
    )
}




export default FormatPicker;