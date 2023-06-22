import { useEffect, useState } from "react";
import "./MainPage.css";
import { useUser, useUserUpdate } from "../../contexts/UserContext";
import UserInfo from "../Authorization/UserInfo";
import { useNavigate } from "react-router-dom";
import { Delete, File, Folder, TextDocumentLetter, ThreeDots } from "../../svgs/svgs";
import useComponentVisible from "../../customhooks/useComponentVisiblity";
import RenameModal from "../Modals/RenameModal";
import { TextDocument } from "../../types";
import DeleteModal from "../Modals/DeleteModal";
import LoadingCircle from "./LoadingCircle";

const MainPage = () => {
    
    const [renameModalInfo, setRenameModalInfo] = useState<{id: string, title: string}>({id: "", title: ""})
    const [documentDropdown, setDocumentDropDown] = useState<string|null>(null) 
    const { ref: renameModalRef, isComponentVisible: isRenameModalVisible, 
        setIsComponentVisible: setIsRenameModalVisible } = useComponentVisible<HTMLDivElement>(false);
    const { ref: deleteModalRef, isComponentVisible: isDeleteModalVisible, 
            setIsComponentVisible: setIsDeleteModalVisible } = useComponentVisible<HTMLDivElement>(false);    
    const [deleteModalInfo, setDeleteModalInfo] = useState<{id: string, title: string}>({id: "", title: ""})

    const userUpdate = useUserUpdate()
    const user = useUser()
    const navigate = useNavigate()

    const openCreateTextDocumentModal = async (templateString: string, title: string) => {
        const id = await userUpdate.createNewDocument(templateString, title)
        if(!id) return
        navigate(`/textDocument/${id}`)
    }

    const formatDate = (dateString: string): string => {
        const options: Intl.DateTimeFormatOptions = { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        };
      
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options);
    }

    const openRenameModal = (document: TextDocument) => {
        setRenameModalInfo({id: document._id, title: document.title})
        setIsRenameModalVisible(true)
        setDocumentDropDown(null)
    }

    const openDeleteModal = (document: TextDocument) => {
        setDeleteModalInfo({id: document._id, title: document.title})
        setIsDeleteModalVisible(true)
        setDocumentDropDown(null)
    }

    useEffect(() => {
        document.title = "TextEditor"
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          const target = event.target as HTMLElement;
          if (!target.closest('.dots') && !target.closest('.option-dropdown') ) {
            setDocumentDropDown(null);
          }
        }
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return(
        <div className="main-page">
            {user.fetchingUserDataFinished?
            <>
            <div className="user-info-container"><UserInfo/></div>
            <div className="container" style={{flexDirection: "column",   backgroundColor: "#f1f3f4"}}>     
                <div className="templates-container">
                    <div className="docs-home-screen-header">
                        <div className="content">Start a new document</div>
                    </div>
              
                    <div className="docs-home-screen-content" >                        
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
        
            <div className="container-documents" style={{flexDirection: "column", backgroundColor: "white", flex: 1}}>  
                <div className="templates-container">   
                    <div className="docs-home-screen-header">
                        <div className="content">Your Documents</div>
                    </div>
                    <div className="docs-home-screen-content" >  
                        {user.userDocuments.length===0?
                            <div className="no-documents-found">You have no documents created so far.</div> 
                        :
                            <>                     
                                {user.userDocuments.map((document, index) => (
                                    <div className="template"  style={{}} key={`template ${index}`}>
                                        <div className="container-document-info">
                                            <div>{document.title}</div>
                                            <div className="flex-row">
                                                <File color={true} height={20} width={20}/>{formatDate(document.lastUpdatedAt)}
                                                <div className="dots-container"> 
                                                    <button onClick={()=>setDocumentDropDown(document._id)} className="button-div dots"><ThreeDots/></button> 
                                                </div>
                                                {documentDropdown === document._id?
                                                    <div className="option-dropdown">
                                                        <button onClick={()=>openRenameModal(document)} className="button-div"><TextDocumentLetter/> <div>Rename</div></button>
                                                        <button onClick={()=>openDeleteModal(document)} className="button-div"><Delete/> Delete</button>
                                                        <button onClick={()=>window.open(`/textDocument/${document._id}`, '_blank')} className="button-div"><Folder/>Open</button>
                                                    </div>
                                                    :
                                                    null
                                                }
                                            </div>
                                        </div>
                                        <div onClick={()=>navigate(`/textDocument/${document._id}`)} 
                                            style={{scale: "0.3", transformOrigin: "top left"}}  
                                            className="template-editor" dangerouslySetInnerHTML={{__html: user.logged? document.text: ""}}>
                                        </div >
                                    </div>
                                ))} 
                            </>   
                        }   
                        </div>
                    </div> 
                </div>
            <RenameModal isModalOpen={isRenameModalVisible} setIsModalOpen={setIsRenameModalVisible} innerRef={renameModalRef}
                titleName={renameModalInfo.title} idOfDocument={renameModalInfo.id}/>
             <DeleteModal isModalOpen={isDeleteModalVisible} setIsModalOpen={setIsDeleteModalVisible} innerRef={deleteModalRef}
                titleName={deleteModalInfo.title} idOfDocument={deleteModalInfo.id}/>
            </>
            :
            <LoadingCircle/>
            }
        </div>
    )
}

export default MainPage;