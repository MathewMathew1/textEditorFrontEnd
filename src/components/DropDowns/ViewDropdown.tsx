import { Check } from "../../svgs/svgs";
import { useEditor, useEditorUpdate } from "../../contexts/UseEditorProvider"
import useComponentVisible from "../../customhooks/useComponentVisiblity";
import { useBackdrop, useBackdropUpdate } from "../../contexts/BackdropContext";

const ViewDropdown = () => {
    const editorValues = useEditor()
    const editorUpdate = useEditorUpdate()
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible<HTMLDivElement>(false);
    const backdropUpdate = useBackdropUpdate()
    const backdrop = useBackdrop()

    return (
        <div ref={ref} className="dropdown">
            <button className="button-div" onClick={()=>setIsComponentVisible(true)}>View</button>
            {isComponentVisible?
                <div onClick={()=>setIsComponentVisible(false)} style={{minWidth: "300px"}} className="dropdown-content">    
                    <button onClick={()=>editorUpdate.setShowRuler(!editorValues.showRuler)} className="button-div dropdown-option ">
                        <div className="checker-container">{editorValues.showRuler? <Check />: null}</div>
                        <div className="text-option-dropdown">Show Ruler</div>
                    </button>
                    <button onClick={()=>backdropUpdate.setShowNonePrintingCharacters(!backdrop.showNonePrintingCharacters)} className="button-div dropdown-option ">
                        <div className="checker-container">{backdrop.showNonePrintingCharacters? <Check />: null}</div>
                        <div className="text-option-dropdown">Show Not Printing characters</div>
                    </button>
                </div>
            :
                null
            }

        </div>
    )
}

export default ViewDropdown