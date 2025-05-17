import { Warning } from "../svgs/svgs";
import { useEditor, useEditorUpdate } from "../contexts/UseEditorProvider";
import { File } from "../svgs/svgs";
import "./Filebar.css";
import FileDropdown from "./DropDowns/FileDropDown";
import EditDropdown from "./DropDowns/EditDropdown";
import ViewDropdown from "./DropDowns/ViewDropdown";
import FormatDropdown from "./DropDowns/FormatDropdown";
import { titleRoute } from "../routes";
import { useUser } from "../contexts/UserContext";
import { Link } from "react-router-dom";
import AvatarComponent from "./Authorization/Avatar";
import { useRef, useState } from "react";
import ProfileDropdown from "./Authorization/ProfileDropdown";
import InsertDropdown from "./DropDowns/InsertDropdown";

const FileBar = () => {
    const [showProfileDropDown, setShowProfileDropdown] = useState(false)
    const titleInput = useRef<HTMLInputElement>(null);
    const editorValues = useEditor()
    const editorUpdate = useEditorUpdate()
    const user = useUser()
    const controller = new AbortController()

    const handleBlur = ()  => {
        document.title = editorValues.title
        if(!editorValues.realDocument) return

        const { signal } = controller

        const body = {
            "title": editorValues.title,
        }

        fetch(titleRoute+editorValues.documentId,{
        method: "POST",
        signal,
        body: JSON.stringify(body),
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }})
        .catch((error)=>{console.log(error)})
    }

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
    }

    return (
        <div className="grid-container">
            <div className="grid-item item1">
                <div>
                    <File color={true} height={32} width={32}/>
                </div>
            </div>
            <div className="grid-item item2">
                <div>
                    <input ref={titleInput} onBlur={handleBlur} onKeyDown={(e)=>handleKeyPress(e)} 
                        value={editorValues.title} onChange={(e)=>editorUpdate.updateTitle(e.target.value)}  className="title-input"></input>
                </div>
            </div>
            <div style={{display: "flex"}} className="grid-item item3">
                <FileDropdown titleInput={titleInput}/>
                <EditDropdown/>
                <ViewDropdown/>
                <InsertDropdown/>
                <FormatDropdown/>
     
            </div>
            <div className="grid-item item4">
          
                {user.logged?
                    <div className="profile-container">
                        <div onClick={()=>setShowProfileDropdown(!showProfileDropDown)} style={{position: "relative"}}>
                            <AvatarComponent name={user.userSignature}/>
                            <ProfileDropdown visible={showProfileDropDown}></ProfileDropdown>
                        </div>
                        
                    </div>
                :
                    <div className="warning-container">
                        <Warning/>
                       <div>You are not logged, your progress is only stored on this device, <Link to={"/login"}> login here </Link></div> 
                    </div>
                }
            </div>
        </div>
        )
    }




export default FileBar;