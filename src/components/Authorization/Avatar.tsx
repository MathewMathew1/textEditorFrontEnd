import { stringToColor } from "../../Utilities/colors";
import "./Avatar.css";

const AvatarComponent = ({name}: {name: string}): JSX.Element => {

    return(
        <div style={{backgroundColor: stringToColor(name)}} className="profile-image">{name[0]}</div>
    )
}

export default AvatarComponent