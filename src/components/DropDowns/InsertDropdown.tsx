import { Download, Image, Link, Table } from "../../svgs/svgs";
import { useEditor, useEditorUpdate } from "../Editor";
import useComponentVisible from "../../customhooks/useComponentVisiblity";
import { useRef, useState } from "react";
import ModalImageLink from "../StyleComponents/MiniModals/ModalImageLink";
import { imageRoute } from "../../routes";
import "./InsertDropdown.css";
import { clamp } from "../../Utilities/colors";

const InsertDropdown = () => {
    const editorValues = useEditor()
    const editorUpdate = useEditorUpdate()
    const { ref: linkModalRef, isComponentVisible: isLinkModalVisible, setIsComponentVisible: setIsLinkModalVisible } = useComponentVisible<HTMLDivElement>(false);
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible<HTMLDivElement>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const controller = new AbortController()
    const [numberOfRows, setNumberOfRows] = useState(1)
    const [numberOfColumns, setNumberOfColumns] = useState(1)

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedImage = event.target.files![0];
        const formData = new FormData();
        formData.append('image', selectedImage);
        const { signal } = controller

        fetch(imageRoute,{
            method: "POST",
            signal,
            body: formData,
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                
            }})
            .then(response => response.json())
            .then(response => {
                let link = response.link
                if(link){
                    editorUpdate.addImage({imageUrl: link, passedRange: editorValues.savedSelection})
                    return
                }
                console.error('Image upload failed');
            })
            .catch((error)=>console.error('Error uploading image:', error))
    };  

    return (
        <div ref={ref} className="dropdown">
            <button className="button-div" onClick={()=>setIsComponentVisible(true)}>Insert</button>
            
            {isComponentVisible?
                <div style={{minWidth: "300px"}} className="dropdown-content">
                    <div className="sidebar">
                        <button  className="button-div dropdown-option">
                            <div><Table/></div>
                            <div className="text-option-dropdown">Table</div>
                            <div className="right-triangle"></div>
                        </button>
                        <div style={{minWidth: "250px"}} className="sidebar-content right">   
                            <div style={{display: "flex", flexDirection: "column"}}>
                                <div className="container-table-input">
                                    <label htmlFor="numberOfRows" className="label">Rows:</label>      
                                    <input id="numberOfRows" type="number" min={1} max={10} className="text-option-dropdown" value={numberOfRows} 
                                        onChange={(e)=>setNumberOfRows(clamp(parseInt(e.target.value),1, 10))}></input>
                                </div>
                                <div className="container-table-input">
                                    <label htmlFor="numberOfColumns" className="label">Columns:</label>      
                                    <input id="numberOfColumns" type="number" min={1} max={6} className="text-option-dropdown" value={numberOfColumns} 
                                        onChange={(e)=>setNumberOfColumns(clamp(parseInt(e.target.value),1, 6))}></input>
                                </div>
                            </div>
                            <button onClick={()=>editorUpdate.createTable(numberOfRows,numberOfColumns)} className="button-div dropdown-option ">
                                <div><Table/></div>
                                <div className="text-option-dropdown">Create Table</div>
                            </button>
                        </div>
                    </div>
                    <hr ></hr>
                 
                    <button  className="button-div dropdown-option">
                        <div><Image /></div>
                        <div className="text-option-dropdown">Print</div>
                        <div >Ctrl+P</div>
                    </button>
                    <div className="sidebar">
                        <button className="button-div dropdown-option ">
                            <div><Image /></div>
                            <div className="text-option-dropdown">Image</div>
                            <div className="right-triangle"></div>
                        </button>
                        <div style={{minWidth: "250px"}} className="sidebar-content right">
                   
                            <button onClick={()=>fileInputRef.current?.click()} className="button-div dropdown-option " >
                                <div><Download/></div>

                               
                                <div className="text-option-dropdown">From Computer</div>
                            </button>
                            <button onClick={()=>setIsLinkModalVisible(true)} className="button-div dropdown-option ">
                                <div><Link/></div>
                                <div className="text-option-dropdown">By Url</div>
                            </button>

                        </div>
                    </div>
                    <input ref={fileInputRef} accept="image/*" style={{zIndex: 22, display: "none"}} type="file" onChange={(e)=>handleImageChange(e)} ></input>
                </div>
            :
                null
            }
            <ModalImageLink isModalOpen={isLinkModalVisible} setIsModalOpen={setIsLinkModalVisible} innerRef={linkModalRef}/>
        </div>
    )
}

export default InsertDropdown