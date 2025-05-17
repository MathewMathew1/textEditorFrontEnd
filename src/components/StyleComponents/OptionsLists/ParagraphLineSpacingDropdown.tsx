import "./ParapgraghSelectList.css";
import "./OptionLists.css";
import { useEditorUpdate } from "../../../contexts/UseEditorProvider"

const ParagraphLineSpacingDropdown= ({setIsModalOpen, setIsComponentVisible}
    :{setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>, setIsComponentVisible?: React.Dispatch<React.SetStateAction<boolean>>}) => {
    const editorUpdate = useEditorUpdate()

    const closeComponent = () => {
        if(setIsComponentVisible) setIsComponentVisible(false)
    }

    return (
        <div onClick={()=>closeComponent()}  className="dropdown-list box-shadow" style={{position: "absolute", top:"25px", width: "250px", maxHeight: "700px"}}>
            <div className="paragraph-spacing">
                <button className="button-select option" onClick={()=>{editorUpdate.updateParagraphs({property: "lineHeight", propertyValue: "1"})}}>
                    <div  >Single</div>
                </button>
                <button onClick={()=>{editorUpdate.updateParagraphs({property: "lineHeight", propertyValue: "1.15"})}} className="button-select option">
                    <div className="" >1.15</div>
                </button>
                <button onClick={()=>{editorUpdate.updateParagraphs({property: "lineHeight", propertyValue: "1.5"})}} className="button-select option">
                    <div className="" >1.5</div>
                </button>
                <button onClick={()=>{editorUpdate.updateParagraphs({property: "lineHeight", propertyValue: "2"})}} className="button-select option">
                    <div className="t" >Double</div>
                </button>
                <hr/>
                <button onClick={()=>{editorUpdate.updateParagraphs({property: "paddingTop", propertyValue: "0.5rem"})}} className="button-select option">
                    <div className="" >Add space before paragraph</div>
                </button>
                <button onClick={()=>{editorUpdate.updateParagraphs({property: "paddingBottom", propertyValue: "0.5rem"})}} className="button-select option">
                    <div className="" >Add space after paragraph</div>
                </button>
                <button onClick={()=>{editorUpdate.updateParagraphs({property: "paddingTop", propertyValue: "0rem"})}} className="button-select option">
                    <div className="" >Remove space before paragraph</div>
                </button>
                <button onClick={()=>{editorUpdate.updateParagraphs({property: "paddingBottom", propertyValue: "0rem"})}} className="button-select option">
                    <div className="" >Remove space after paragraph</div>
                </button>
                <hr/>
                <button onClick={()=>{setIsModalOpen(true)}} className="button-select option">
                    <div className="" >Custom spacing</div>
                </button>
            </div>
        </div>
    )
}




export default ParagraphLineSpacingDropdown;