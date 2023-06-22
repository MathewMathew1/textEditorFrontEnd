import { BiggerIndentation, Bold, ClearFormatting, Column3, Columns, Italic, Justify, JustifyCenter, JustifyLeft, JustifyRight, ListControlled, ListNumbered, ListPoints, SmallerIndentation, Spacing, Strikethrough, Subscript, Superscript, Underline } from "../../svgs/svgs";

import { useEditor, useEditorUpdate } from "../Editor";
import useComponentVisible from "../../customhooks/useComponentVisiblity";
import { clamp } from "../../Utilities/colors";
import { useCallback, useEffect } from "react";
import ParagraphLineSpacingDropdown from "../StyleComponents/OptionsLists/ParagraphLineSpacingDropdown";
import ModalSpacing from "../StyleComponents/OptionsLists/ModalSpacing";
import { deleteNode, getNodesInRange } from "../../Utilities/editors";


const FormatDropdown = () => {
    const editorValues = useEditor()
    const editorUpdate = useEditorUpdate()
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible<HTMLDivElement>(false);
    const { ref: refModal, isComponentVisible: isModalOpen, setIsComponentVisible: setIsModalOpen} = useComponentVisible<HTMLDivElement>(false);
   
    const boldSelection = () => {
        editorUpdate.addStylingToSpan({styleProperty:"fontWeight", styleValue: `bold`, haveOppositeValue:  true, passedRange: editorValues.savedSelection})
    }

    const italicSelection = () => {
        editorUpdate.addStylingToSpan({styleProperty: "fontStyle", styleValue: `italic`, haveOppositeValue: true, passedRange: editorValues.savedSelection})
    }

    const underlineSelection = () => {
        editorUpdate.addStylingToSpan({styleProperty:"textDecoration", styleValue: `underline`, haveOppositeValue: true, passedRange: editorValues.savedSelection})
    }

    const strikethroughSelection = () => {
        editorUpdate.addStylingToSpan({styleProperty:"textDecoration", styleValue: `line-through`, haveOppositeValue: true, passedRange: editorValues.savedSelection})
    }

    const subSelection = (value: string) => {
    
        editorUpdate.addStylingToSpan({styleProperty:"vertical-align",  haveOppositeValue: true, styleValue: value, passedRange: editorValues.savedSelection,
            callbackFunction: (element, _styleProperty, _styleValue, sameValues) => {

                if(sameValues){
                    element.style.removeProperty("vertical-align")
                    const baseValue = element.style.fontSize? parseFloat(element.style.fontSize): 12
                    element.style.fontSize = `${baseValue * 1.25}pt`; // Set the font size to 80% of the current font size
                }
                else{
                    if(element.style.verticalAlign === value) return
                    
                    element.style.verticalAlign = value
                    const baseValue = element.style.fontSize? parseFloat(element.style.fontSize): 12
                    element.style.fontSize = `${baseValue * 0.8}pt`
                }
            }
        })

    }

    const changeTextIndent = (element: HTMLElement, value: string) => {
        let currentIndent = parseFloat(getComputedStyle(element).textIndent)
        let newIndent = clamp(currentIndent + parseInt(value), 0, 700) 
        element.style.textIndent = `${newIndent}px`
    }
    
    const changeIndent = (changeIndentValue: string) => {
        editorUpdate.updateParagraphs({property: "textIndent", propertyValue: changeIndentValue, callback: changeTextIndent})
    }

    const justify = (direction: string) => {
       editorUpdate.updateParagraphs({property: "textAlign", propertyValue: direction, passedRange: editorValues.savedSelection})
    }

    const createColumns = (numberOfColumns: number, passedRange?: Range|null) => {
        let selection = window.getSelection()
        if(selection===null) return

        if(editorValues.markdownInput.current===null) return
        
        const range =  passedRange? passedRange: selection.getRangeAt(0)
        const allSpansInSelectionRange = getNodesInRange(range, ["SPAN", "#text"], editorValues.markdownInput.current!)

        const allPagesSpans = allSpansInSelectionRange.filter((element)=>{
            return (element as HTMLElement).className === "page"
        })

        const rangeStartContainer = range.startContainer
        const rangeEndContainer = range.endContainer
        const rangeStartOffset = range.startOffset
        const rangeEndOffset= range.endOffset
        allPagesSpans.forEach((span)=>{
            
            let gridColumnsString = ""
            for(let i =0; i<numberOfColumns; i++){
                gridColumnsString  = gridColumnsString + `${595/numberOfColumns}pt `
            }
            (span as HTMLElement).style.gridTemplateColumns= gridColumnsString
            
            const rangeInsidePage = new Range()
            rangeInsidePage.selectNodeContents(span)
            const allSpansInPage = getNodesInRange(rangeInsidePage, ["SPAN"], editorValues.markdownInput.current!)
            const columns = allSpansInPage.filter((element)=>{
                return (element as HTMLElement).className === "column"
            })
   
            const isNoChangeRequired = numberOfColumns === columns.length 
            if(isNoChangeRequired) return
            
            if(numberOfColumns===1){
                columns.forEach((column, index)=>{
                    if(index===1) return
                    columns[1].appendChild(column);
                    deleteNode(column)

                })//here
                return
            }
            if(columns.length===0){
                const newColumn = document.createElement('span');
                newColumn.classList.add('column');
                newColumn.style.height = "fit-content"
                surroundChildContentWithElement((span as HTMLElement), newColumn)
                columns.push(newColumn)
            }
            if(numberOfColumns===2){
                if(columns.length<2){
                    const column = createColumn()
                    span.appendChild(column);
                    return
                }
                // Remove the element to delete and replace it with its content at the end of the element to move content to  
                columns[1].appendChild(columns[2]);
                deleteNode(columns[2]);
            }
            if(numberOfColumns===3){
                for(let i=3- numberOfColumns+columns.length; i<numberOfColumns; i++){
                    const column = createColumn()
                    span.appendChild(column);
                }
            }
        })

        range.setStart(rangeStartContainer, rangeStartOffset)
        range.setEnd(rangeEndContainer, rangeEndOffset)
        selection?.removeAllRanges()
        selection?.addRange(range)

        editorValues.textDocument.saveValue(editorValues.markdownInput.current?.innerHTML, true, true);
    }

    function surroundChildContentWithElement(parentElement: HTMLElement, newElement: HTMLElement): void {
        // Create a new element to surround the child content

        // Move the child content into the new element
        while (parentElement.firstChild) {
          newElement.appendChild(parentElement.firstChild);
        }
        
        // Append the new element to the parent element
        parentElement.appendChild(newElement);
      }

    const createColumn = () => {
        const newColumn = document.createElement('span');
        newColumn.classList.add('column');
        newColumn.style.height = "fit-content"

        const p = document.createElement('p');
        const span = document.createElement('span');
        span.textContent = 'New Column';

        p.appendChild(span);
        newColumn.appendChild(p);
        return newColumn
    }

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'b') {
                event.preventDefault()
                boldSelection()
            }
            if (event.ctrlKey && event.key === 'i') {
                event.preventDefault()
                italicSelection()
            }
            if (event.ctrlKey && event.key === 'u') {
                event.preventDefault()
                underlineSelection()
            }
            if (event.ctrlKey && event.key === '[') {
                event.preventDefault()
                changeIndent("-20")
            }
            if (event.ctrlKey && event.key === ']') {
                event.preventDefault()
                changeIndent("20")
            }
            if (event.key === 'L' &&event.ctrlKey && event.shiftKey ) {
                event.preventDefault()
                justify("left")
            }
            if (event.key === 'E' && event.ctrlKey && event.shiftKey  ) {
                event.preventDefault()
                justify("center")
            }
            if (event.key === 'R' && event.ctrlKey && event.shiftKey) {
                event.preventDefault()
                justify("right")
            }
            if (event.key === 'J' && event.ctrlKey && event.shiftKey) {
                event.preventDefault()
                justify("justify")
            }
            if (event.key === '/' && event.ctrlKey ) {
                event.preventDefault()
                editorUpdate.addStylingToSpan({styleProperty: "clear", styleValue: "clear", callbackFunction: clearFormatting})
            }
        },
        [editorValues.textDocument, editorValues.savedSelection]
      );
      const memoizedHandleKeyDown = useCallback(handleKeyDown, [editorValues.textDocument, editorValues.savedSelection]);

    useEffect(() => {
        window.addEventListener('keydown', memoizedHandleKeyDown);
      
        return () => {
          window.removeEventListener('keydown', memoizedHandleKeyDown);
        };
    }, [memoizedHandleKeyDown]);

    const clearFormatting = (element: HTMLElement, _styleProperty: string, _style: string) =>{
        element.style.cssText = '';
    }

    return (
        <div ref={ref} className="dropdown">
            <button className="button-div" onClick={()=>setIsComponentVisible(true)}>Format</button>
            {isComponentVisible?
                <div onClick={()=>setIsComponentVisible(false)} style={{minWidth: "300px"}} className="dropdown-content"> 
                    <div className="sidebar">   
                        <button className="button-div dropdown-option ">
                            <div ><Bold/></div>
                            <div className="text-option-dropdown">Text</div>
                            <div className="right-triangle"></div>
                        </button>
                        <div style={{minWidth: "250px"}} className="sidebar-content right">
                            <button onClick={()=>boldSelection()} className="button-div dropdown-option ">
                                <div ><Bold/></div>
                                <div className="text-option-dropdown">Bold</div>
                                <div >Ctrl+B</div>
                            </button>
                            <button onClick={()=>italicSelection()} className="button-div dropdown-option ">
                                <div ><Italic/></div>
                                <div className="text-option-dropdown">Italic</div>
                                <div >Ctrl+I</div>
                            </button>
                            <button onClick={()=>underlineSelection()} className="button-div dropdown-option ">
                                <div ><Underline/></div>
                                <div className="text-option-dropdown">Underline</div>
                                <div >Ctrl+U</div>
                            </button>
                            <button onClick={()=>strikethroughSelection()} className="button-div dropdown-option ">
                                <div ><Strikethrough/></div>
                                <div className="text-option-dropdown">Strikethrough</div>
                            </button>
                            <button onClick={()=>subSelection("super")} className="button-div dropdown-option ">
                                <div ><Superscript/></div>
                                <div className="text-option-dropdown">Superscript</div>
                            </button>
                            <button onClick={()=>subSelection("sub")} className="button-div dropdown-option ">
                                <div ><Subscript/></div>
                                <div className="text-option-dropdown">Subscript</div>
                            </button>
                        </div>
                        
                    </div>
                    <div className="sidebar">   
                        <button className="button-div dropdown-option ">
                            <div ><BiggerIndentation/></div>
                            <div className="text-option-dropdown">Align & Indent</div>
                            <div className="right-triangle"></div>
                        </button>
                        <div style={{minWidth: "250px"}} className="sidebar-content right">
                            <button onClick={()=>justify("left")} className="button-div dropdown-option ">
                                <div ><JustifyLeft/></div>
                                <div className="text-option-dropdown">Left</div>
                                <div >Ctrl+Shit+L</div>
                            </button>
                            <button onClick={()=>justify("center")} className="button-div dropdown-option ">
                                <div ><JustifyCenter/></div>
                                <div className="text-option-dropdown">Center</div>
                                <div >Ctrl+Shit+E</div>
                            </button>
                            <button onClick={()=>justify("right")} className="button-div dropdown-option ">
                                <div ><JustifyRight/></div>
                                <div className="text-option-dropdown">Right</div>
                                <div >Ctrl+Shit+R</div>
                            </button>
                            <button onClick={()=>justify("justify")} className="button-div dropdown-option ">
                                <div ><Justify/></div>
                                <div className="text-option-dropdown">Justify</div>
                                <div >Ctrl+Shit+J</div>
                            </button>
                            <hr ></hr>
                            <button onClick={()=>changeIndent("20")} className="button-div dropdown-option ">
                                <div ><BiggerIndentation/></div>
                                <div className="text-option-dropdown">Increase Indent</div>
                                <div >Ctrl+]</div>
                            </button>
                            <button onClick={()=>changeIndent("-20")} className="button-div dropdown-option ">
                                <div ><SmallerIndentation/></div>
                                <div className="text-option-dropdown">Decrease Indent</div>
                                <div >Ctrl+[</div>
                            </button>
                        </div>
                        
                    </div>
                    <div className="sidebar">   
                        <button className="button-div dropdown-option ">
                            <div ><Spacing/></div>
                            <div className="text-option-dropdown">Line & Paragraph spacing</div>
                            <div className="right-triangle"></div>
                        </button>
                        <div style={{minWidth: "250px"}} className="sidebar-content right">
                            <ParagraphLineSpacingDropdown setIsModalOpen={setIsModalOpen}/>
                            
                        </div>
                        
                    </div>
                    <div className="sidebar">   
                        <button className="button-div dropdown-option ">
                            <div ><Columns/></div>
                            <div className="text-option-dropdown">Columns</div>
                            <div className="right-triangle"></div>
                        </button>
                        <div style={{minWidth: "250px"}} className="sidebar-content right">
                            <button onClick={()=>createColumns(1, editorValues.savedSelection)} className="button-div dropdown-option ">
                                <div  ><Column3  /></div>
                                <div className="text-option-dropdown">1 Column</div>
                            </button>
                            <button onClick={()=>createColumns(2, editorValues.savedSelection)} className="button-div dropdown-option ">
                                <div  ><Column3  /></div>
                                <div className="text-option-dropdown">2 Columns</div>
                            </button>
                            <button onClick={()=>createColumns(3, editorValues.savedSelection)} className="button-div dropdown-option ">
                                <div  ><Column3  /></div>
                                <div className="text-option-dropdown">3 Columns</div>
                            </button>
                        </div>
                        
                    </div>
                    <div className="sidebar">   
                        <button className="button-div dropdown-option ">
                            <div ><ListControlled/></div>
                            <div className="text-option-dropdown">Lists</div>
                            <div className="right-triangle"></div>
                        </button>
                        <div style={{minWidth: "250px"}} className="sidebar-content right">
                            <button className="button-div dropdown-option " onClick={()=>editorUpdate.addList("ul")}>
                                <div><ListPoints color={false}/></div>
                                <div className="text-option-dropdown">List Pointed</div>
                            </button>
                            <button className="button-div dropdown-option " onClick={()=>editorUpdate.addList("ol")}>
                                <div><ListNumbered color={false}/></div>
                                <div className="text-option-dropdown">List Numbered</div>
                            </button>
                        </div>
                    </div>
                    <hr/>
                    <button onClick={()=>editorUpdate.addStylingToSpan({styleProperty: "clear", styleValue: "clear", callbackFunction: clearFormatting})} className="button-div dropdown-option">
                        <div><ClearFormatting/></div>
                        <div className="text-option-dropdown">Clear Formatting</div>
                        <div >Ctrl+/</div>
                    </button>
                </div>
            :
                null
            }
            <ModalSpacing innerRef={refModal} isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}/>
        </div>
    )
}

export default FormatDropdown