
import { useState, useEffect } from "react";
import "./Modal.css";
import { useEditor, useEditorUpdate } from  "../../../contexts/UseEditorProvider";
import { createLinkFromString } from "../../../Utilities/editors";

const LinkModal= ({isModalOpen, setIsModalOpen, innerRef}: {
        setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>, 
        isModalOpen: boolean, 
        innerRef: React.RefObject<HTMLDivElement>
    }) => {
    const [linkText, setLinkText] = useState("")
    const [linkName, setLinkName] = useState("")  
    const [showTextField, setShowTextField] = useState(false)
    const editorValues = useEditor()
    const editorUpdate = useEditorUpdate()

    useEffect(() => {
        if(isModalOpen){      
            const range = editorValues.savedSelection;
            if(range===null) return

            setShowTextField(range.toString()==="")
        }
    }, [isModalOpen]);

    useEffect(() => {
        if(!isModalOpen) setLinkName(editorValues.link)
    }, [isModalOpen, editorValues.link]);
   
    return (
        <>
            {isModalOpen?
                <div style={{left: 0, top: 60 }} className="link-modal" ref={innerRef}>
                    <div className="link-input-container">
                        {showTextField?
                            <div className="link-input-group">
                                <label htmlFor="linkText" className="link-label">Text</label>
                                <input id="linkText" value={linkText} onChange={(e)=>setLinkText(e.target.value)} className="link-input"></input>
                            </div>
                        :
                            null
                        }
                        <div className="link-input-group">
                            <label htmlFor="linkName" className="link-label">Link</label>
                            <input id="linkName" value={linkName} onChange={(e)=>setLinkName(e.target.value)} className="link-input"></input>
                            <button onClick={()=>{
                                editorUpdate.addLink({linkName: createLinkFromString(linkName), linkText, passedRange: editorValues.savedSelection})
                                setIsModalOpen(false)
                            }} disabled={linkName===""} className="button-div apply-button">Apply</button>
                        </div>
                    </div>
                </div>
            :
                null
            }
        </>
        
    )
}




export default LinkModal;