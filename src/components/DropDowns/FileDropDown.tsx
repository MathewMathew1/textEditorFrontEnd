import { Folder, Download, Pencil, Delete, Print, File } from "../../svgs/svgs";
import { mainFonts } from "../../Utilities/fonts";
import { htmlDocument } from "../../Utilities/html";
import { useEditor } from "../Editor";
import useComponentVisible from "../../customhooks/useComponentVisiblity";
import { useEffect } from "react";
import { useUser, useUserUpdate } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import DocumentsTemplateModal from "../Modals/DocumentsTemplateModal";
import OpenDocumentsTemplateModal from "../Modals/OpenDocumentsTemplateModal";

const FileDropdown = ({titleInput}:{titleInput: React.RefObject<HTMLInputElement>}) => {
    const userUpdate = useUserUpdate()
    const user = useUser()
    const editorValues = useEditor()
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible<HTMLDivElement>(false);
    const { ref: templatesModalRef, isComponentVisible: isTemplatesModalVisible, 
        setIsComponentVisible: setIsTemplatesModalVisible } = useComponentVisible<HTMLDivElement>(false);
    const { ref: templatesOpenModalRef, isComponentVisible: isTemplatesOpenModalVisible, 
        setIsComponentVisible: setIsTemplatesOpenModalVisible } = useComponentVisible<HTMLDivElement>(false);
    const navigate = useNavigate()

    /*const downLoadPdf = async () => {
        const contentCanvas = await html2canvas(editorValues.markdownInput.current!);
        const image = contentCanvas.toDataURL("image/png");
        const doc = new jsPDF();
        doc.addImage(image, "png", 0, 0);
  
        doc.save('document.pdf');
    }*/

    const downLoadText = async () => {
       const text = editorValues.markdownInput.current!.textContent!;

        // Create a new Blob object with the text content and specify the MIME type as plain text
        const blob = new Blob([text], { type: "text/plain" });

        // Create a new anchor element and set the download attribute and href
        const a = document.createElement("a");
        a.download = `${editorValues.title}.txt`;
        a.href = URL.createObjectURL(blob);

        // Click the anchor element to initiate the download
        a.click();
    }

   /* const downloadHtmlZipFile = () => {
        const text = htmlDocument(editorValues.textDocument.value)
        const zip = new JSZip();
        zip.file(`${editorValues.title}.html`, text);
        zip.generateAsync({ type: "blob" })
            .then((blob: any) => {
                const a = document.createElement("a");
                a.download = `${editorValues.title}.zip`;
                a.href = URL.createObjectURL(blob);
                a.click();
            });
    }*/

    async function downloadDocxFile() {
        const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'/><title>Export HTML To Doc</title>${mainFonts()}
        </head><body>`;
        const postHtml = "</body></html>"
        const html = preHtml + editorValues.textDocument.value + postHtml

        const blob = new Blob([new Uint8Array(), html], {
            type: 'application/msword',
      
        })
        
        const filename = `${editorValues.title}.doc`
        // Create download link element
        const downloadLink = document.createElement("a");
         
        downloadLink.download =  filename;
        downloadLink.href = URL.createObjectURL(blob);
        
        // Setting the file name
        
        downloadLink.click();
        //triggering the function
    }

    const printDocument = async () => {
        const content = htmlDocument(editorValues.textDocument.value)
        // Create a new window with the content to print
        const newWindow = window.open('', 'Print Window');
        newWindow!.document.body.innerHTML = content;
        newWindow?.print()
    }

    useEffect(() => {   
        const handleKeyDown = (event: KeyboardEvent) => {         
            if (event.ctrlKey && event.key === 'p') {
                event.preventDefault()
                printDocument()
            }
        }
    
        window.addEventListener('keydown', (e)=>handleKeyDown(e));
    
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const createNewDocument = async () => {
        const id = await userUpdate.createNewDocument(user.templates[0].template, user.templates[0].templateName)
        if(!id) return
        navigate(`/textDocument/${id}`)
    }

    const deleteDocument = () => {
        userUpdate.deleteDocument(editorValues.documentId)
        navigate(`/`)
    }

    return (
        <>
            <div ref={ref} className="dropdown">
                <button className="button-div" onClick={()=>setIsComponentVisible(true)}>File</button>
                {isComponentVisible?
                    <div onClick={()=>setIsComponentVisible(false)} style={{minWidth: "300px"}} className="dropdown-content">
                        <div className="sidebar">
                            <button className="button-div dropdown-option ">
                                <div><File color={false}/></div>
                                <div className="text-option-dropdown">New</div>
                                <div className="right-triangle"></div>
                            </button>
                            <div style={{minWidth: "250px"}} className="sidebar-content right">
                                <button onClick={()=>createNewDocument()} className="button-div dropdown-option ">
                                    <div><File color={true}/></div>
                                    <div className="text-option-dropdown">Empty Document</div>
                                </button>
                                <button onClick={()=>setIsTemplatesModalVisible(true)} className="button-div dropdown-option ">
                                    <div><File/></div>
                                    <div className="text-option-dropdown">Document from Template</div>
                                </button>
                            </div>
                        </div>
                        <button onClick={()=>setIsTemplatesOpenModalVisible(true)} className="button-div dropdown-option">
                            <div><Folder/></div>
                            <div className="text-option-dropdown">Open</div>
                        </button>
                        <hr ></hr>
                        <div className="sidebar">
                            <button className="button-div dropdown-option ">
                                <div><Download/></div>
                                <div className="text-option-dropdown">Download</div>
                                <div className="right-triangle"></div>
                            </button>
                            <div style={{minWidth: "250px"}} className="sidebar-content right">
                                <button onClick={()=>downLoadText()} className="button-div dropdown-option ">
                                    <div className="text-option-dropdown">Plain text (.text)</div>
                                </button>
                                <button onClick={()=>downloadDocxFile()} className="button-div dropdown-option ">
                                    <div className="text-option-dropdown">MicrosoftWord (.docx)</div>
                                </button>
                            </div>
                        </div>
                        <hr></hr>
                        <button onClick={()=>{titleInput.current?.focus()}} className="button-div dropdown-option">
                            <div><Pencil/></div>
                            <div className="text-option-dropdown">Rename</div>
                        </button>
                        <button onClick={()=>deleteDocument()} className="button-div dropdown-option">
                            <div><Delete/></div>
                            <div className="text-option-dropdown">Delete</div>
                        </button>
                
                        <hr></hr>
                        <button onClick={()=>printDocument()} className="button-div dropdown-option">
                            <div><Print color={false}/></div>
                            <div className="text-option-dropdown">Print</div>
                            <div >Ctrl+P</div>
                        </button>
                    </div>
                :
                    null
                }
                
            </div>
            <DocumentsTemplateModal isModalOpen={isTemplatesModalVisible} setIsModalOpen={setIsTemplatesModalVisible} 
                innerRef={templatesModalRef}/>
            <OpenDocumentsTemplateModal isModalOpen={isTemplatesOpenModalVisible} setIsModalOpen={setIsTemplatesOpenModalVisible} 
                innerRef={templatesOpenModalRef}/>
        </>
    )
}

export default FileDropdown