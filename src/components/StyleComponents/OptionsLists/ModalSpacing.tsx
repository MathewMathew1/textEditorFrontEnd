import { useState } from "react";
import "./ModalSpacing.css";
import "./OptionLists.css";
import { useEditor, useEditorUpdate } from "../../Editor";

const ModalSpacing = ({isModalOpen, setIsModalOpen, innerRef}: {
        setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>, 
        isModalOpen: boolean, 
        innerRef: React.RefObject<HTMLDivElement>
    }) => {
    const editorUpdate = useEditorUpdate()
    const editorValues = useEditor()
    const [lineSpacing, setLineSpacing] = useState("1.15")
    const [paddingTop, setPaddingTop] = useState(0)
    const [paddingBottom, setPaddingBottom] = useState(0)
   
    const applyChanges = () => {
        const newLineSpacing = isNaN(parseFloat(lineSpacing))? "1": lineSpacing
        setLineSpacing(newLineSpacing)

        editorUpdate.updateParagraphs({
            property: "lineHeight", 
            propertyValue: `${newLineSpacing}px`, 
            callback: changeValues,
            passedRange: editorValues.savedSelection
        })
    }

    const changeValues = (element: HTMLElement, value: string) => {
        element.style.lineHeight = `${lineSpacing.toString()}`
        element.style.paddingBottom = `${paddingBottom.toString()}px`
        element.style.paddingTop = `${paddingTop.toString()}px`
    }

    return (
        <>
            {isModalOpen?
                    <div   className="modal"  >
                        <div ref={innerRef} className="modal-content">
                            <div><h4>Custom Spacing</h4></div>            
                            <div>
                                <h4>Line Spacing</h4>
                                <input value={lineSpacing} onChange={(e)=>setLineSpacing(e.target.value)} className="number-input"></input>
                            </div>
                            <div>
                                <h4>Paragraph Spacing</h4>
                            </div>
                            <div className="label-flex">
                                    <label className="margin-small">Before</label>
                                    <input type="number" value={paddingTop} onChange={(e)=>setPaddingTop(e.target.valueAsNumber)} className="number-input"></input>
                                    <label className="margin-small">After</label>
                                    <input type="number" value={paddingBottom} onChange={(e)=>setPaddingBottom(e.target.valueAsNumber)} className="number-input"></input>
                            </div>
                            <div className="button-group">
                                <button onClick={()=>setIsModalOpen(false)} className="btn cancel">Cancel</button>
                                <button onClick={()=>{applyChanges(); setIsModalOpen(false)}} className="btn apply">Apply</button>
                            </div>
                        </div>
                    </div>
                :
                    null
            }
        </>
    )
}

export default ModalSpacing
