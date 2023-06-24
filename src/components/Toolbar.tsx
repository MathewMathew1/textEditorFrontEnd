import { clamp } from "../Utilities/colors";
import useComponentVisible from "../customhooks/useComponentVisiblity";
import { GoBack, GoForward, Print, SpellCheck, Link, Comment, Image, JustifyLeft, JustifyCenter, JustifyRight, Justify, Spacing, ListControlled, ListPoints, ListNumbered, SmallerIndentation, BiggerIndentation, ClearFormatting } from "../svgs/svgs"; 
import { useEditor, useEditorUpdate } from "./Editor";
import LinkModal from "./StyleComponents/MiniModals/ModalLink";
import FontPicker from "./StyleComponents/OptionsLists/FontPicker";
import FormatPicker from "./StyleComponents/OptionsLists/FormatPicker";
import ParagraphSelectList from "./StyleComponents/OptionsLists/ParapgraghSelectList";
import ColorPicker from "./StyleComponents/Selector/ColorPicker";
import { Tooltip } from "./Tootltip";
import { ALIGN_TYPES } from "./Editor";
import { htmlDocument } from "../Utilities/html";

const FONT_SIZE_BOUNDARY = {
    MIN: 1,
    MAX: 400
}

const OPTIONS_SCALING = [
    "50", "75", "90", "100", "125", "150", "200"
]

const Toolbar = () => {
    const { ref: refColor, isComponentVisible: showColorPicker, setIsComponentVisible :setShowColorPicker  } = useComponentVisible<HTMLDivElement>(false);
    const { ref: refBackgroundColor, isComponentVisible: showBackgroundColorPicker, setIsComponentVisible :setShowBackgroundColorPicker  } = useComponentVisible<HTMLDivElement>(false);
    const { ref: refLinkModal, isComponentVisible: isLinkModalVisible, setIsComponentVisible: setIsLinkModalVisible } = useComponentVisible<HTMLDivElement>(false);
    const editorValues = useEditor()
    const editorUpdate = useEditorUpdate()

    const changeTextIndent = (element: HTMLElement, value: string) => {
        let currentIndent = parseFloat(getComputedStyle(element).textIndent)
        let newIndent = clamp(currentIndent + parseInt(value), 0, 700) 
        element.style.textIndent = `${newIndent}px`
    }

    const toggleSpellCheck = (newValue: boolean) => {
        if (editorValues.markdownInput.current) {
            editorValues.markdownInput.current.spellcheck = newValue;
        }
        editorUpdate.setSpellCheck(newValue)
    }

    const changeFontSize = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>|React.ChangeEvent<HTMLInputElement>, newValue: string) => {
        e.preventDefault()

        editorUpdate.addStylingToSpan({styleProperty: "fontSize", styleValue: newValue, callbackFunction: changeFontSizeCallBack})
    }

    const changeFontSizeByNumber = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            const value = parseInt((event.target as HTMLInputElement).value)

            if(isNaN(value)){
                editorUpdate.setFontSize("16")
                return
            }
            const clampedValue = clamp(value, FONT_SIZE_BOUNDARY.MIN, FONT_SIZE_BOUNDARY.MAX)

            editorUpdate.addStylingToSpan({styleProperty: "fontSize", styleValue: `${clampedValue}px`, passedRange: editorValues.savedSelection, 
            callbackFunction : (element)=> {
                let newFontSize = clampedValue
                if(element.style.verticalAlign === "sub" || element.style.verticalAlign === "super"){
                    newFontSize = clampedValue * 0.8
                }
                element.style.fontSize = `${newFontSize}px`
            }})
        }
    }

    const changeFontSizeCallBack = (element: HTMLElement, styleProperty: string, styleValue: string) => {
        const baseValue = element.style.fontSize? parseFloat(element.style.fontSize): 12
        let addedValue = styleValue === "+"? 1: -1
        if(element.style.verticalAlign === "sub" || element.style.verticalAlign === "super"){
            addedValue = addedValue * 0.8
        }

        const newValue = clamp(baseValue + addedValue, FONT_SIZE_BOUNDARY.MIN, FONT_SIZE_BOUNDARY.MAX)
        element.style.fontSize = `${newValue}px`
    }   

    const changeBackgroundColor = (color: string) => {
        editorUpdate.setBackgroundColor(color)
        editorUpdate.addStylingToSpan({styleProperty: "backgroundColor", styleValue: color})
    }

    const changeColor = (color: string) => {
        editorUpdate.setColor(color)
        editorUpdate.addStylingToSpan({styleProperty: "color", styleValue: color})
    }

    const clearFormatting = (element: HTMLElement, _styleProperty: string, _style: string) =>{
        element.style.cssText = '';
    }

    const printDocument = async () => {
        const content = htmlDocument(editorValues.textDocument.value)
        // Create a new window with the content to print
        const newWindow = window.open('', 'Print Window');
        newWindow!.document.body.innerHTML = content;
        newWindow?.print()
    }

    return (
        <div className="toolbar-area">
            <div className="tooltip">
                <button onClick={()=>editorValues.textDocument.undo()} className="button-div clickable padding0">                  
                    <GoBack />
                </button>
                <Tooltip text="Undo(Ctrl+Z)"/>
            </div>
            <div className="tooltip">
                <button onClick={()=>editorValues.textDocument.redo()} className="button-div clickable padding0">
                    <GoForward/>
                </button>
                <Tooltip text="Redo(Ctrl+Y)"/>
            </div>
            <div className="tooltip">
                <button onClick={()=>printDocument()} className="button-div clickable padding0">
                    <Print/>
                </button>
                <Tooltip text="Print"/>
            </div>
            
            <div className="tooltip" >
                <button onClick={()=>toggleSpellCheck(!editorValues.spellCheck)} className="button-div clickable padding0">
                    <SpellCheck  color={editorValues.spellCheck}/>
                </button>
                <Tooltip text="Spellcheck"/>
            </div>
            <span className="border"/>
        
            <div className="tooltip">
                <select className="clickable selector" value={editorValues.scale} onChange={(e)=>editorUpdate.setScale(e.target.value)}>
                    {OPTIONS_SCALING.map( (value,i) => 
                        <option key={`scale ${i}`}>{value}%</option> )
                    }
                </select>
                <Tooltip text="Zoom"/>
            </div>
            <span className="border"/>
            <div  className="tooltip" >
                <FontPicker
                
                />
                <Tooltip text="Font"/>
            </div>
            <span className="border"/>
            <div className="tooltip" >
                <FormatPicker/>
                <Tooltip text="Styles"/>
            </div>
            <div className="showOnBig">
                <form className="number-picker">
            
                    <button className="value-button clickable" onClick={(e)=>changeFontSize(e, "-")}>-</button>
                    <input type="number" value={editorValues.fontSize} onKeyDown={(e)=>changeFontSizeByNumber(e)} onChange={(e)=>editorUpdate.setFontSize(e.target.value)} className="value-number clickable"></input>
                    <button className="value-button clickable" onClick={(e)=>changeFontSize(e, "+")}>+</button>
                </form>
                <div className="flex-row" style={{marginLeft: "1rem"}}>
                    <div className="tooltip">
                        <button  onClick={()=>editorUpdate.addStylingToSpan({styleProperty:"fontWeight", styleValue: `bold`, haveOppositeValue:  true})} 
                            className="option-style clickable" 
                            style={{fontWeight: "bold", backgroundColor: editorValues.textBolded===true? "var(--hover-blue)": "white"}}>
                            B
                        </button>
                        <Tooltip text="Bold (Ctrl+B)"/>
                    </div>
                    <div className="tooltip">
                        <button onClick={()=>editorUpdate.addStylingToSpan({styleProperty: "fontStyle", styleValue: `italic`, haveOppositeValue: true})} 
                            className="option-style clickable" style={{fontStyle: "italic", fontWeight: "bold",
                            backgroundColor: editorValues.textItalic===true? "var(--hover-blue)": "white"}}>
                            I
                        </button>
                        <Tooltip text="Italic (Ctrl+I)"/>
                    </div>
                    <div className="tooltip">
                        <button onClick={()=>editorUpdate.addStylingToSpan({styleProperty:"textDecoration", styleValue: `underline`, haveOppositeValue: true})} className="option-style clickable " 
                            style={{textDecoration: "Underline", fontWeight: "bold", backgroundColor: editorValues.textUnderScore===true? "var(--hover-blue)": "white"}}>
                            U
                        </button>
                        <Tooltip text="Underscore (Ctrl+U)"/>
                    </div>
                    <div  ref={refColor} className="tooltip " style={{fontWeight: "bold"}}>
                        <div style={{position: "relative"}}>
                            <button className="button-div clickable padding0" onClick={()=>setShowColorPicker(true)} style={{color: editorValues.color}}>abc</button>
                            <ColorPicker  setValueColor={changeColor} setShowComponent={setShowColorPicker} showComponent={showColorPicker}/>
                        </div>
                        <Tooltip text="Text Color"/>
                    </div>
                    <div className="tooltip" ref={refBackgroundColor}   style={{fontWeight: "bold"}}>
                        <div style={{position: "relative"}}>
                            <button className="button-div clickable padding0" onClick={()=>setShowBackgroundColorPicker(true)} style={{backgroundColor: editorValues.backgroundColor}}>abc</button>
                            <ColorPicker setValueColor={changeBackgroundColor} setShowComponent={setShowBackgroundColorPicker} showComponent={showBackgroundColorPicker}/>
                        </div>
                        <Tooltip text="Highlight Color"/>
                    </div>
                    <span className="border"/>
                    <div>
                        <div className="tooltip">
                            <button onClick={()=>setIsLinkModalVisible(!isLinkModalVisible)}  className="button-div clickable padding0">
                                <Link/>
                            </button>
                            <Tooltip text="Insert Link"/>
                        </div>
                        <LinkModal innerRef={refLinkModal} isModalOpen={isLinkModalVisible} setIsModalOpen={setIsLinkModalVisible}/>    
                    </div>

                    <div className="tooltip">
                        <button className="button-div clickable padding0">
                            <Image />
                        </button>
                        <Tooltip text="Insert image"/>
                    </div>
                    <span className="border"/>
                    <div  className="tooltip">
                        <button style={{backgroundColor: editorValues.align===ALIGN_TYPES.Left? "var(--hover-blue)": "white"}} 
                            onClick={()=>editorUpdate.updateParagraphs({property: "textAlign", propertyValue: "left"})} 
                            className="button-div clickable padding0">
                            <JustifyLeft color={false}/>
                        </button>
                        <Tooltip text="Left align"/>
                    </div>
                    <div  className="tooltip">
                        <button style={{backgroundColor: editorValues.align===ALIGN_TYPES.Center? "var(--hover-blue)": "white"}} 
                            onClick={()=>editorUpdate.updateParagraphs({property: "textAlign", propertyValue: "center"})} 
                            className="button-div clickable padding0">
                        <JustifyCenter color={false}/>
                        </button>
                        <Tooltip text="Center align"/>
                    </div>
                    <div  className="tooltip">
                        <button style={{backgroundColor: editorValues.align===ALIGN_TYPES.Right? "var(--hover-blue)": "white"}} 
                            onClick={()=>editorUpdate.updateParagraphs({property: "textAlign", propertyValue: "right"})}
                            className="button-div clickable padding0">
                            <JustifyRight color={false}/>
                        </button>
                        <Tooltip text="Right align"/>
                    </div>
                    <div className="tooltip">
                        <button style={{backgroundColor: editorValues.align===ALIGN_TYPES.Justify? "var(--hover-blue)": "white"}}   
                            onClick={()=>editorUpdate.updateParagraphs({property: "textAlign", propertyValue: "justify"})} 
                            className="button-div clickable padding0">
                        <Justify color={false}/>
                        </button>
                        <Tooltip text="Justify"/>
                    </div>
                    <span className="border"/>
                    <div >
                        <ParagraphSelectList />                                
                        
                    </div>
                    <span className="border"/>
   
                    <div className="tooltip">
                        <button style={{backgroundColor: editorValues.bulletedList? "var(--hover-blue)": "white"}}
                            onClick={()=>editorUpdate.addList("ul")} className="button-div clickable padding0">
                            <ListPoints color={false}/>
                        </button>
                        <Tooltip text="Bulleted List"/>
                    </div>
                    <div className="tooltip">
                        <button style={{backgroundColor: editorValues.numberedList? "var(--hover-blue)": "white"}}  
                            onClick={()=>editorUpdate.addList("ol")} className="button-div clickable padding0">
                            <ListNumbered color={false}/>
                        </button>
                        <Tooltip text="Numbered List"/>
                    </div>
                    <div className="tooltip">
                        <button onClick={()=>editorUpdate.updateParagraphs({property: "textIndent", propertyValue: "-20;", callback: changeTextIndent})} className="button-div clickable padding0">
                            <SmallerIndentation/>
                        </button>
                        <Tooltip text="Decrease indent"/>
                    </div>
                    <div className="tooltip">
                        <button  onClick={()=>editorUpdate.updateParagraphs({property: "textIndent", propertyValue: "20;", callback: changeTextIndent})} className="button-div clickable padding0">
                            <BiggerIndentation/>
                        </button>
                        <Tooltip text="Increase indent"/>
                    </div>
                    <div className="tooltip">
                        <button  onClick={()=>editorUpdate.addStylingToSpan({styleProperty: "clear", styleValue: "clear", callbackFunction: clearFormatting})} className="button-div clickable padding0">
                            <ClearFormatting/>
                        </button>
                        <Tooltip text="Clear Formatting"/>
                    </div>
                </div>
            </div>
        </div>
        )
    }




export default Toolbar;