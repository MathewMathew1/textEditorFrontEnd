
import { useState } from "react";
import "./Modal.css";
import { useEditor, useEditorUpdate } from "../../../contexts/UseEditorProvider";

const ModalImageLink = ({isModalOpen, setIsModalOpen, innerRef}: {
        setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>, 
        isModalOpen: boolean, 
        innerRef: React.RefObject<HTMLDivElement>
    }) => {
    const [imageLink, setImageLink] = useState("")
    const [isProperImage, setIsProperImage] = useState({isUrl: false, isImage: false})
    const [showImage, setShowImage]= useState(false)
    const editorValues = useEditor()
    const editorUpdate = useEditorUpdate()

    const checkImageURL = (url: string): { isURL: boolean; isImage: boolean } => {
        // check if url is valid
        let validUrl = false;
        try {
          const parsedUrl = new URL(url);
          validUrl = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
        } catch (error) {}
      
        if (!validUrl) {
          return { isURL: false, isImage: false };
        }
      
        // check if url leads to image
        const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg"];
        const fileExtension = url.split(".").pop()?.toLowerCase();
      
        if (fileExtension && imageExtensions.includes(fileExtension)) {
          return { isURL: true, isImage: true };
        } else {
          return { isURL: true, isImage: false };
        }
      };

    const changeImageLink = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageLink(e.target.value)
        const stringProperties = checkImageURL(e.target.value)
        setIsProperImage({isUrl: stringProperties.isURL, isImage: stringProperties.isImage})
        setShowImage(stringProperties.isImage)
    }

    const addImage = () => {
        setIsModalOpen(false)
        editorUpdate.addImage({imageUrl: imageLink, passedRange: editorValues.savedSelection})
    }

    return (
        <>
            {isModalOpen?
                <div className="modal" >
                    <div ref={innerRef} className="modal-content">
                        <div className="link-image-container">
                            {!showImage?
                                <>
                                    <div>Insert Image</div>
                                    <input placeholder={"Paste url"} className="image-link-input" value={imageLink} onChange={(e)=>changeImageLink(e)}></input>
                                </>
                            :
                                <div className="image-link-shown-container">
                                    <img style={{maxWidth:"400px", maxHeight: "400px"}} src={imageLink} alt="Your image"></img>
                                    <button onClick={()=>setShowImage(false)} className="close-image-preview">X</button>
                                </div>
                            }
                            <div className="btn-image-link-group">
                                <button className="button-cancel" onClick={()=>setIsModalOpen(false)}>Cancel</button>
                                <button className="button-cancel" disabled={!isProperImage.isImage} 
                                    onClick={()=>addImage()}>Insert Image</button>
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




export default ModalImageLink;