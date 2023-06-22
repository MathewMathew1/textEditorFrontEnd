
import { useState, useEffect } from "react";
import { useUserUpdate } from "../../contexts/UserContext";
import "./Modals.css";

const RenameModal= ({isModalOpen, setIsModalOpen, innerRef, titleName, idOfDocument}: {
        setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>, 
        isModalOpen: boolean, 
        innerRef: React.RefObject<HTMLDivElement>,
        titleName: string,
        idOfDocument: string
    }) => {
    const [newTitle, setNewTitle] = useState(titleName)  
    const userUpdate = useUserUpdate()

    useEffect(() => {
        setNewTitle(titleName)
    }, [titleName]);
   
    return (
        <>
            {isModalOpen?
                <div className="action-modal" ref={innerRef}>
                    <div className="modal-container">
                        <h3>Rename</h3>
                        <label className="modal-label" htmlFor="title">Please enter new name for item</label>
                        <input id="title" className="modal-input" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)}></input>
                        <div className="modal-btn-group">
                            <button onClick={()=>setIsModalOpen(false)} className="btn cancel">Cancel</button>
                            <button className="btn apply" onClick={()=>{userUpdate.changeTitle(idOfDocument, newTitle); setIsModalOpen(false)}}>Ok</button>
                        </div>
                    </div>
                </div>
            :
                null
            }
        </>
        
    )
}

export default RenameModal;