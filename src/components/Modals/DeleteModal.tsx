
import { useUserUpdate } from "../../contexts/UserContext";
import "./Modals.css";

const DeleteModal = ({isModalOpen, setIsModalOpen, innerRef, titleName, idOfDocument}: {
        setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>, 
        isModalOpen: boolean, 
        innerRef: React.RefObject<HTMLDivElement>,
        titleName: string,
        idOfDocument: string
    }) => {
    const userUpdate = useUserUpdate()
   
    return (
        <>
            {isModalOpen?
                <div className="action-modal" ref={innerRef}>
                    <div className="modal-container">
                        <h3>Are you sure you want to delete {titleName} document</h3>
                        <div className="modal-btn-group">
                            <button onClick={()=>setIsModalOpen(false)} className="btn cancel">Cancel</button>
                            <button className="btn delete" onClick={()=>{userUpdate.deleteDocument(idOfDocument); setIsModalOpen(false)}}>Delete</button>
                        </div>
                    </div>
                </div>
            :
                null
            }
        </>    
    )
}

export default DeleteModal;