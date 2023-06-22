import useComponentVisible from "../../../customhooks/useComponentVisiblity";
import { Spacing } from "../../../svgs/svgs";
import "./ParapgraghSelectList.css";
import "./OptionLists.css";
import ModalSpacing from "./ModalSpacing";
import { Tooltip } from "../../Tootltip";
import ParagraphLineSpacingDropdown from "./ParagraphLineSpacingDropdown";

const ParagraphSelectList = () => {
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible<HTMLDivElement>(false);
    const { ref: refModal, isComponentVisible: isModalOpen, setIsComponentVisible: setIsModalOpen} = useComponentVisible<HTMLDivElement>(false);
    return (
        <div  className="flex clickable" style={{position: "relative"}} ref={ref}>
            <div className="tooltip">
                <button onClick={()=>setIsComponentVisible(true)} className="button-div clickable padding0">
                    <Spacing color={false}/>
                </button>
                <Tooltip text="Line and paragraph spacing"/>  
            </div>              
            {isComponentVisible?
                <ParagraphLineSpacingDropdown setIsModalOpen={setIsModalOpen} setIsComponentVisible={setIsComponentVisible}/>
            :
                null 
            }
            <ModalSpacing innerRef={refModal} isModalOpen={(isModalOpen)} setIsModalOpen={setIsModalOpen}/>
        </div>
    )
}




export default ParagraphSelectList;