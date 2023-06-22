import { Link } from "react-router-dom";
import { useUser, useUserUpdate } from "../../contexts/UserContext";
import "./ProfileDropdown.css";

const ProfileDropdown = ({visible}:{visible: boolean}): JSX.Element => {
    const user = useUser()
    const updateUser = useUserUpdate()

    return(
        <>
            {visible?
                <div className="profile-dropdown">
                    <div>{user.userSignature}</div>
                    <hr/>
                    <Link to="/" className="dropdown-button">MainPage</Link>
                    <button onClick={()=>updateUser.logout()} className="dropdown-button">Logout</button>   
                </div>
            :
                null
            }
        </>
    )
}

export default ProfileDropdown