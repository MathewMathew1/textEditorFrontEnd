import { useUser } from "../../contexts/UserContext";
import "./Modals.css";
import "./DocumentsTemplate.css";
import { useNavigate } from "react-router-dom";

const OpenDocumentsTemplateModal = ({isModalOpen, setIsModalOpen, innerRef}: {
        setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>, 
        isModalOpen: boolean, 
        innerRef: React.RefObject<HTMLDivElement>,
    }) => {
    const user= useUser()
    const navigate = useNavigate()
   
    return (
        <>
            {isModalOpen?
                <div onClick={()=>setIsModalOpen(false)} style={{overflow: "hidden"}} className="action-modal" ref={innerRef}>
                    <div className="modal-container">
                        <div >
                            <h2 style={{textAlign: "center"}}>Your Documents</h2>
                            {  user.userDocuments.length===0?
                                    <div>You have no documents</div>
                                :
                                <div className="template-container" >                  
                                    {user.userDocuments.map((document, index) => (
                                        <div className="template withoutInfo"  style={{}} key={`template ${index}`}>
                                            <div className="template-title">{document.title}</div>
                                            <div onClick={()=>navigate(`/textDocument/${document._id}`)} style={{scale: "0.3", transformOrigin: "top left"}}  
                                                className="template-editor" dangerouslySetInnerHTML={{__html: user.logged? document.text: "Some text"}}>
                                            </div >
                                        </div>
                                    ))}
                                </div>  
                            }               
                        </div>
                    </div>
                </div>
            :
                null
            }
        </>
        
    )
}

export default OpenDocumentsTemplateModal;