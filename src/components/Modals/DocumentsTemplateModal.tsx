
import { useUser, useUserUpdate } from "../../contexts/UserContext";
import "./Modals.css";
import "./DocumentsTemplate.css";
import { useNavigate } from "react-router-dom";

const DocumentsTemplateModal = ({isModalOpen, setIsModalOpen, innerRef}: {
        setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>, 
        isModalOpen: boolean, 
        innerRef: React.RefObject<HTMLDivElement>,
    }) => {
    const userUpdate = useUserUpdate()
    const user= useUser()
    const navigate = useNavigate()

    const openCreateTextDocumentModal = async (templateString: string, title: string) => {
        const id = await userUpdate.createNewDocument(templateString, title)
        if(!id) return
        navigate(`/textDocument/${id}`)
    }
   
    return (
        <>
            {isModalOpen?
                <div onClick={()=>setIsModalOpen(false)} style={{overflow: "hidden"}} className="action-modal" ref={innerRef}>
                    <div className="modal-container">
                        <div className="">
                            
                            <h2 style={{textAlign: "center"}}>Document Templates</h2>
                            <div className="template-container" >                        
                                {user.templates.map((template, index) => (
                                    <div className="template withoutInfo"  style={{}} key={`template ${index}`}>
                                        <div className="template-title">{template.templateName}</div>
                                        <div onClick={()=>openCreateTextDocumentModal(template.template, template.templateName)} style={{scale: "0.3", transformOrigin: "top left"}}  
                                            className="template-editor" dangerouslySetInnerHTML={{__html: template.template}}>
                                        </div >
                                    </div>
                                ))}       
                            </div>                 
                        </div>
                    </div>
                </div>
            :
                null
            }
        </>
        
    )
}

export default DocumentsTemplateModal;