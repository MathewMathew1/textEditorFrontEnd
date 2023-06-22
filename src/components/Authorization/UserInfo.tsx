import { useState } from "react"
import { useUser } from "../../contexts/UserContext"
import { Warning } from "../../svgs/svgs"
import AvatarComponent from "./Avatar"
import ProfileDropdown from "./ProfileDropdown"
import { Link } from "react-router-dom"


const UserInfo = () => {
    const [showProfileDropDown, setShowProfileDropdown] = useState(false)
    const user = useUser()

    return(
    <>
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
                <div> You are not logged,<Link to={"/login"}> login here </Link></div> 
            </div>
        }     
    </>
    )
}

export default UserInfo