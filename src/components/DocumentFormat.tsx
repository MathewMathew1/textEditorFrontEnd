import { useCallback, useEffect, useRef, useState } from "react";
import ContentEditable from 'react-contenteditable';
import { getParentNodeWithTag, splitNodes, createRangeFromNodeAndRange, getFurthestParentNodeContainingOnlyText, deleteNode, createElementInRange, isNestedFirstChild, findColumnParent } from "../Utilities/editors";
import RulerHorizontal from "./StyleComponents/Rulers/RulerHorizontal";
import RulerVertical from "./StyleComponents/Rulers/RulerVertical";
import { useEditor, useEditorUpdate }  from "../contexts/UseEditorProvider"
import ImageResizer from "./DropDowns/ImageResizer";
import { ImageResizeInfo, cellResizeInfoType } from "../types";
import { areNodesEqual, normalParagraph } from "../Utilities/document";
import { useBackdrop } from "../contexts/BackdropContext";
import TableResizer from "./DropDowns/TableResizer";

const PRE_EDITOR_AREA = 100

const COMMENT_HOLDER_WIDTH = 300


const DocumentFormat = () => {
    const [editorWidth, setEditorWidth] = useState(111) 
    const [heightOfOffset, setHeightOfOffset] = useState(50) 
    const [showImageResizer, setShowImageResizer] = useState(false)
    const [showTableCellResizer, setShowTableCellResizer] = useState(false)
    const editorValues = useEditor()
    const editorUpdate = useEditorUpdate()
    const textEditorArea = useRef<HTMLDivElement>(null);
    const documentArea = useRef<HTMLDivElement>(null);
    const paperAreaRef = useRef<HTMLDivElement>(null);
    const [numberPages, setNumberPages] = useState<number>(1);
    const [cellResizeInfo, setCellResizerInfo] = useState<cellResizeInfoType >({top:0, left:0, bottom: 0, right: 0, 
        initialHeight:0, initialWidth:0, maxBottom: 0, maxTop:0, maxRight: 0, maxLeft: 0})
    const [imageResizerInfo, setImageResizerInfo] = useState<ImageResizeInfo>({top: 0, left: 0, width: 0, rotateDegree: 0,
        height: 0, image: null, maxHeight: 0, maxWidth: 0, bottom: 0, right: 0, centerX: 0, centerY: 0})
    const backdrop = useBackdrop()
    
    const handleMarkdownChange = (e: React.FormEvent<HTMLDivElement>) => {
        editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, false, false);
    };

    const handleClickOutside = (event: MouseEvent) => {
        const clickedElement = event.target as HTMLElement;
        const isFileInputClicked =clickedElement.tagName.toLowerCase() === 'input'
        if(isFileInputClicked){ //check if input was clicked
            return
        }
        event.preventDefault()
    };

    useEffect(() => {
        
        const resizeObserver = new ResizeObserver(() => {
            if(!textEditorArea.current || !editorValues.markdownInput.current) return
            
            editorUpdate.setOffsetForRuler(editorValues.markdownInput.current?.getBoundingClientRect().left)
            setEditorWidth(textEditorArea.current?.getBoundingClientRect().width )
        });

        const resizeObserver2 = new ResizeObserver(() => {
            setHeightOfOffset(documentArea.current!.getBoundingClientRect().top )
        });
        
        resizeObserver.observe(textEditorArea.current!);
        resizeObserver2.observe(documentArea.current!);

        return () => { 
            resizeObserver.disconnect(); // clean up 
            resizeObserver2.disconnect();
        }
        
    }, []);

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

   const changeOffsetRuler = () => {
 
    if(!textEditorArea.current || !editorValues.markdownInput.current) return
        editorUpdate.setOffsetForRuler(editorValues.markdownInput.current?.getBoundingClientRect().left)
    }

   const enterPressed = (event: KeyboardEvent) => {
        event.preventDefault();
        
        const selection = window.getSelection();
        if (!selection) return;

        let range = selection.getRangeAt(0);
        range.deleteContents();
        const parentNodeOfStart = getParentNodeWithTag(range.startContainer, ["p", "li"])
    
        if(parentNodeOfStart?.nodeName==="P" && !event.shiftKey){
            const brCreated = createElementInRange("br", range)
            const nextNodeIsEmptyText = brCreated.nextSibling?.nodeName==="#text"  && brCreated.nextSibling.textContent === ""
        
            if (nextNodeIsEmptyText) {
                brCreated.nextSibling.textContent = " "
                range.setStartAfter(brCreated);
                // If there is a sibling node, set the range to start at the beginning of that node
            
            } else {
                // Otherwise, set the range to start at the end of the <br> tag itself
                range.setStartAfter(brCreated);
            }
            range.setEnd(range.startContainer, range.startOffset);
              editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, false);
            return
        }

        if(!parentNodeOfStart) return
        const rangeTillEndOFParagraph = createRangeFromNodeAndRange({range: range, node: parentNodeOfStart, fromStartOfRange: true})

        let splitNode = splitNodes(parentNodeOfStart, rangeTillEndOFParagraph)
        if(splitNode === undefined){
            const startElement = rangeTillEndOFParagraph.startContainer
            let parentNode = getFurthestParentNodeContainingOnlyText(startElement, startElement.textContent!)
            
            if(parentNode.nodeName!=="SPAN"){
                let deepestChild = parentNode
                while(deepestChild.hasChildNodes()){
                    deepestChild = deepestChild.firstChild! as HTMLElement;
                    if(deepestChild.nodeName==="SPAN"){
                        parentNode = deepestChild
                        break
                    }
                }
            }

            if(parentNode.nodeName==="SPAN"){
                splitNode = parentNode
            }
            else if(parentNode.nodeName==="P" || parentNode.nodeName==="LI"){
                let newSpan = document.createElement("span");
                while(parentNode.hasChildNodes())
                    newSpan.appendChild(parentNode.firstChild!);

                parentNode.appendChild(newSpan);
            }else{
                const newSplit = document.createElement("span");
                parentNode.parentNode!.insertBefore(newSplit, parentNode);
                newSplit.appendChild(parentNode);
                splitNode = newSplit
            }
        }
        const splitNodeElement = splitNode as HTMLElement
        
        const tagElement2 = parentNodeOfStart.cloneNode(true) as HTMLElement
        let tagElement 
       
        tagElement = parentNodeOfStart.cloneNode(true)as HTMLElement
        
        // getting node that will be surrounded with new paragraph

        if(splitNode){
            range.setStartBefore(splitNode)
            range.setEnd(parentNodeOfStart, parentNodeOfStart.childNodes.length)
        }
        range.surroundContents(tagElement)

        // creating paragraph before selection
        range.setStart(parentNodeOfStart, 0)
        range.setEndBefore(tagElement)
        range.surroundContents(tagElement2)

        // deleting paragraph that was containing selection
        deleteNode(parentNodeOfStart)

        if(splitNodeElement.textContent ===""){
            let deepestChild = splitNodeElement
            while(deepestChild.hasChildNodes()){
                deepestChild = deepestChild.firstChild! as HTMLElement;
            }
            deepestChild.innerHTML ="&#xFEFF;" // using zero width space since other way caveat would not show inside created tag
            range.setStart( tagElement.firstChild!, 1 ) ;
            range.setEnd( tagElement.firstChild!, 1 )
        }
        else{
            range.setStart(tagElement, 0)
            range.setEnd(tagElement, 0)
            range.collapse(true)
        }
        if(tagElement2.textContent ===""){
            let deepestChild = tagElement2
            while(deepestChild.hasChildNodes()){
                deepestChild = deepestChild.firstChild! as HTMLElement;
            }
            deepestChild.innerHTML ="&#xFEFF;"
        }

        selection.removeAllRanges();
        selection.addRange(range);
        editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, false);
   }

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const selection = window.getSelection();    
        if (!selection || !editorValues.markdownInput.current?.contains(selection.anchorNode)) return

        if (event.key === "Enter") {
            enterPressed(event)
        }

        if(event.key == " " ){
            
            if (selection && !selection.isCollapsed) {
                event.preventDefault()
                editorUpdate.deleteSelection()
            }   
        }

        if(event.key === "Backspace" ){
            const selection = window.getSelection();
            const range = selection!.getRangeAt(0);
          
            if (selection && selection.isCollapsed) {
                const columnParent = findColumnParent(range.startContainer as HTMLElement)
                const selectionStartsAtBeginningOfColumn = elementIsAtStartOfColumn(columnParent, range.startContainer as HTMLElement) && range.startOffset === 0
                const deletedElementIsSpanInTable = range.startOffset ===1 && range.startContainer.parentNode?.parentNode?.nodeName === "TD"
                const previousSibling = range.startContainer.parentNode?.previousSibling as HTMLElement
                
                const previousSiblingIsStartOfColumn = previousSibling? elementIsAtStartOfColumn(columnParent, previousSibling) && range.startOffset === 0
                : false

                if (selectionStartsAtBeginningOfColumn || deletedElementIsSpanInTable || 
                    (previousSiblingIsStartOfColumn && (previousSibling.textContent==="" || previousSibling.innerHTML===String.fromCharCode(8203)))) {
                    event.preventDefault()
                }
            }
            else{
                event.preventDefault()
                editorUpdate.deleteSelection()
            }
        }   
    }, [editorValues.textDocument]);

    const elementIsAtStartOfColumn = (columnParent: HTMLElement|null, element: HTMLElement) => {
       return columnParent?.firstChild === element || isNestedFirstChild(element , columnParent!) 
    }

    const handleClick = useCallback((e: MouseEvent) => {
        if (e.target instanceof HTMLTableCellElement) {
            setShowTableCellResizer(true)
            moveTableResizer(e.target)
        }else{
            setShowTableCellResizer(false)
        }

        if (e.target instanceof HTMLImageElement) {
            moveImageResizer(e.target)
            setShowImageResizer(true)
        }
        else{
            setShowImageResizer(false)
        }
    },[editorValues.scale])

    const moveTableResizer = (cell: HTMLTableCellElement) => {
        const convertedScale = parseFloat(editorValues.scale)/100
        const row = cell.parentElement as HTMLTableRowElement
        const table = cell.parentElement?.parentElement?.parentElement!
        const page = table.parentNode! as HTMLElement
        const cellWidth = cell.offsetWidth;
        const cellHeight = cell.offsetHeight;

        const { left, top, bottom, right } = cell.getBoundingClientRect(); 

        const previousCell = cell.previousElementSibling as HTMLElement
        let maxLeft
        if(previousCell){
            maxLeft = (previousCell.getBoundingClientRect().left- textEditorArea.current!.offsetLeft + 20)/convertedScale
        }else{
            maxLeft = (table.getBoundingClientRect().left- textEditorArea.current!.offsetLeft)/convertedScale
        }

        const nextCell = cell.nextElementSibling
        let maxRight
        if(nextCell){
            maxRight = (nextCell.getBoundingClientRect().right- textEditorArea.current!.offsetLeft - 20)/convertedScale
        }else{
            maxRight = (table.getBoundingClientRect().right- textEditorArea.current!.offsetLeft)/convertedScale
        }

        const newtRow = row.nextElementSibling
        let maxBottom
        if(newtRow){
            maxBottom = (newtRow.getBoundingClientRect().bottom - textEditorArea.current!.getBoundingClientRect().top - 16)/convertedScale
        }else{
            maxBottom = (page.getBoundingClientRect().bottom- textEditorArea.current!.getBoundingClientRect().top)/convertedScale
        }

        const previousRow = row.previousElementSibling
        let maxTop
        if(previousRow){
            maxTop = (previousRow.getBoundingClientRect().top- textEditorArea.current!.getBoundingClientRect().top + 16)/convertedScale
        }else{
            maxTop = (page.getBoundingClientRect().top- textEditorArea.current!.getBoundingClientRect().top)/convertedScale
        }

        const leftConverted = (left - textEditorArea.current!.offsetLeft)/convertedScale
        const topConverted = (top - textEditorArea.current!.getBoundingClientRect().top)/convertedScale
        const bottomConverted = (bottom- textEditorArea.current!.getBoundingClientRect().top)/convertedScale
        const rightConverted = (right- textEditorArea.current!.offsetLeft)/convertedScale

        setCellResizerInfo({initialHeight:cellHeight, initialWidth:cellWidth, maxLeft: maxLeft, maxRight, maxBottom, maxTop,
            left: leftConverted, top: topConverted, bottom: bottomConverted, right: rightConverted, cell})
    }

    const moveImageResizer = (image: HTMLImageElement) => {
        const convertedScale = parseFloat(editorValues.scale)/100
        const { width, height } = image.getBoundingClientRect();

        const rotatedRect =  image.getBoundingClientRect() ;
        const centerX = rotatedRect.left + (rotatedRect.width / 2);
        const centerY = rotatedRect.top + (rotatedRect.height / 2);

        const leftBeforeRotation  = centerX -  image.offsetWidth/2 // if image is rotated we need to find left value that is before rotation we do that by finding center and reducing width
        const topBeforeRotation  = centerY -  image.offsetHeight/2
        
        const leftConverted = (leftBeforeRotation - textEditorArea.current!.offsetLeft)/convertedScale
        const topConverted = (topBeforeRotation - textEditorArea.current!.getBoundingClientRect().top)/convertedScale

        const centerXConverted = (centerX -textEditorArea.current!.offsetLeft)/convertedScale
        const centerYConverted = (centerY -textEditorArea.current!.getBoundingClientRect().top)/convertedScale

        const newRotate = parseInt(image!.style.rotate) || 0
    
        setImageResizerInfo({ left: leftConverted, top: topConverted, width: image.offsetWidth, right: leftConverted + width, 
        bottom: topConverted  + height,height: image.offsetHeight, rotateDegree: newRotate, 
        centerX: centerXConverted, centerY: centerYConverted, 
        image: image, maxWidth: 111, maxHeight:444 });
    }

    const handleResize = useCallback(() => {
        if(!imageResizerInfo.image) return
        moveImageResizer(imageResizerInfo.image)
    }, [imageResizerInfo.image, editorValues.scale])

    useEffect(() => {
        if(imageResizerInfo.image){
            moveImageResizer(imageResizerInfo.image)
        }
    }, [editorValues.scale]);

    const memoizedHandleKeyDown = useCallback(handleKeyDown, [editorValues.textDocument]);
    const memoizedOnClick = useCallback(handleClick, [editorValues.textDocument]);
    const memoizedResize = useCallback(handleResize, [imageResizerInfo.image, editorValues.scale]);

    useEffect(() => {
        // we use useeffect to listen to keyboard event because, onkeydown event shows only default values of states variables when used on ContentEditable component
        window.addEventListener('keydown', memoizedHandleKeyDown);
        window.addEventListener("click", memoizedOnClick);    

        return () => {
            window.removeEventListener('keydown', memoizedHandleKeyDown);
            window.removeEventListener("click", memoizedOnClick);
        };
    }, [memoizedHandleKeyDown]);
    
    useEffect(() => {
        window.addEventListener('resize', memoizedResize);

        return () => {
            window.removeEventListener('resize', memoizedResize);
        };
    }, [memoizedResize]);

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        // Get the pasted text
        const pastedText = event.clipboardData.getData("text/plain");
      
        // Remove any HTML tags from the pasted text
        const strippedText = pastedText.replace(/<[^>]*>/g, "");
      
        // Insert the stripped text into the editor
        document.execCommand("insertHTML", false, strippedText);
      
        // Prevent the default paste behavior
        event.preventDefault();
    }  
      
    const updatePages = async () => {
        const container = editorValues.markdownInput.current;
        if (container) {
            const spans = editorValues.markdownInput.current!.getElementsByTagName('span') 
            const pageSpans: {page: HTMLElement, columns: HTMLElement[] }[] = []
            for(let i=0; i<spans.length; i++){
                if(spans[i].classList.contains("page")){
                    const columns = Array.from(spans[i].getElementsByTagName('span')).filter((span)=>span.classList.contains("column"))
                    pageSpans.push({page: spans[i], columns})
                }
            }
            const imagePromises: Promise<void>[] = [];
            const imagesInDocument: HTMLImageElement[] = []
            pageSpans.forEach((span)=> {
                const images = Array.from(span.page.getElementsByTagName('img'))
                imagesInDocument.push(...images)
            }) 
            
            imagesInDocument.forEach((img) => {
                const imagePromise = new Promise<void>((resolve) => {
                img.onload = () => {
                    resolve();
                };
                });
                imagePromises.push(imagePromise);
            });
            
            await Promise.all(imagePromises).then(() => { // waiting till images loaded so high will correct for them
                pageSpans.forEach(({ page, columns }, index) => {
                    const computedStyle = window.getComputedStyle(page);
                    const pageHeight = page.clientHeight - parseFloat(computedStyle.paddingTop) - parseFloat(computedStyle.paddingBottom);
       
                    columns.forEach((column, columnIndex) => {
                        const columnOverflow = column.scrollHeight - pageHeight;
                        if (columnOverflow > 0) { 
                            const overflowingContent = findOverflowingContent(column, page)
 
                            if (pageSpans.length<=index+1) { // creating new page and adding conentn to it

                                const newPage = page.cloneNode() as HTMLElement;
                                const newColumns: HTMLElement[] = []
                                container.insertBefore(newPage, page.nextSibling);
                                columns.forEach((column2, i)=>{
                                    const newColumn = column2.cloneNode() as HTMLElement;
                                    newColumns.push(newColumn)
                                    newPage.appendChild(newColumn);
                                
                                    if(i===columnIndex){
                                    
                                        overflowingContent.forEach((content)=>{
                                            
                                            newColumn.insertBefore(content, newColumn.firstChild);
                                        })  
                                    }else{
                                        const paragraph = normalParagraph()
                                        newColumn.appendChild(paragraph)
                                    }
                                })
                                pageSpans.push({page:newPage, columns: newColumns})
                            }
                            else{ // moving contentn to next page
                       
                                const nextPage = pageSpans[index+1]
                                const columnIndexInNextPage = Math.min(columnIndex, nextPage.columns.length-1)
                                const columnInNextPage = nextPage.columns[columnIndexInNextPage]
                             
                                const isFirstInColumnContinuation = areNodesEqual(overflowingContent[0], columnInNextPage.firstChild as HTMLElement)
                                && areNodesEqual(overflowingContent[0].firstChild as HTMLElement, columnInNextPage.firstChild?.firstChild as HTMLElement)

                                if(overflowingContent.length===1 && isFirstInColumnContinuation){
                                    
                                    const elementToAddText = columnInNextPage.firstChild?.firstChild as HTMLElement
                                
                                    const elementAddingTextFrom = overflowingContent[0].firstChild as HTMLElement
                                    const textToAdd = elementAddingTextFrom.textContent || ""
                                    elementToAddText.insertAdjacentText('afterbegin', textToAdd)
                                }else{
                                    overflowingContent.forEach((content)=>{
                                        columnInNextPage.insertBefore(content, columnInNextPage.firstChild)
                                    })
                                }                               
                            }
                        }             
                    });
                });
            })
            setNumberPages(pageSpans.length)
            editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, false, false, true)
            // get overflowing content from each column (each page/column has 297 mm )
        }
    };

    const findOverflowingContent = (column: HTMLElement, page: HTMLElement) => {
        const removedElements: HTMLElement[] = [];
        let previousElementOverflowing = false

        const bottom = page.getBoundingClientRect().bottom- parseFloat(getComputedStyle(page).paddingBottom);
        
        const children = [...column.children]
        for (let i = 0; i < children.length; i++) {
            const childElement = children[i] as HTMLElement;
            const totalBottomSpacing = parseFloat(getComputedStyle(childElement).paddingBottom) + parseFloat(getComputedStyle(childElement).marginBottom)
     
            if (previousElementOverflowing === true) {
                removedElements.push(childElement);
                continue
            }

            if(childElement.nodeName==="TABLE"){
               
                if(bottom - childElement.getBoundingClientRect().bottom - parseFloat(getComputedStyle(childElement).marginBottom)  < 0){
                    removedElements.push(childElement);
                    continue
                }
            }
                 
            const elementsToRemoveInside = []
            for (let a = 0; a < childElement.children.length; a++) {
                const childOfChildElement = childElement.children[a] as HTMLElement;
                const bottomOfThisChild =  childOfChildElement.getBoundingClientRect().bottom  + totalBottomSpacing

                if(bottom - bottomOfThisChild  < 0){
                    
                    previousElementOverflowing = true

                    const childIsList = childElement.nodeName === "OL" || childElement.nodeName === "UL"
                    if(a===0 && childIsList){
                        removedElements.push(childElement);
                        column.removeChild(childElement);
                        break
                    }

                    const remainingChildren = [...childElement.children]
                    for(let indexRemainingChild = a; indexRemainingChild < remainingChildren.length; indexRemainingChild++){
                        const child = remainingChildren[indexRemainingChild] as HTMLElement;
                        const topOfThisChild =  child.getBoundingClientRect().top 
                        const isTextSpan = child.nodeName === "SPAN" && childElement.nodeName === "P"
                       
                        if(isTextSpan ){
                            const overflownText = getOverflowingText(child, bottom-topOfThisChild - totalBottomSpacing)
                            if(overflownText.deleteWhole){
                                if(indexRemainingChild===0){
                                    removedElements.push(childElement);
                                    column.removeChild(childElement);

                                    break
                                }
                                elementsToRemoveInside.push(child);
                                childElement.removeChild(child);

                            }else{
                                const copiedSpanText = child.cloneNode(true) as HTMLElement
                                copiedSpanText.innerHTML = overflownText.textToRemove

                                elementsToRemoveInside.push(copiedSpanText);
                            }
                        }else{

                            elementsToRemoveInside.push(child);
                            childElement.removeChild(child);
                        }
                    }
                    break
                                    
                }
            }
            if(elementsToRemoveInside.length>0){
                const toRemove = childElement.cloneNode() as HTMLElement
                elementsToRemoveInside.reverse().forEach((element)=> {
                    toRemove.insertBefore(element, toRemove.firstChild)
                })
                if(toRemove.nodeName==="OL"){
                    (toRemove as HTMLUListElement).setAttribute("start", (childElement.childNodes.length+1).toString())
                }
              
                removedElements.push(toRemove);
            }       
        }
        return removedElements.reverse();
    }

    const getOverflowingText = (htmlElement: HTMLElement, remainingPossibleHeight: number) => {
        const originalText = htmlElement.innerHTML;
        
        let deleteWhole = false
        // Replace <br> tags with newline characters (\n)
        let modifiedText = originalText
        let startIndex = modifiedText.length;
        const text = modifiedText
        let textToRemove = ""
        while (startIndex > 1) {
        // Find the next index of newline character or start of the text
            startIndex = startIndex - 1
            const isPartOfBrTag = isBr(text, startIndex)
            
            if (isPartOfBrTag) {
                continue; // Skip characters within <br> tags
            }
            modifiedText = text.split('').map((char, index) => {
                if (startIndex===index) {
                return `<span>${char}</span>`;
                }
                return char;
            }).join('');
        
            htmlElement.innerHTML = modifiedText
            const span = htmlElement.querySelector("span")!
            
            const isTextAboveBottomOfPage = remainingPossibleHeight > span?.getBoundingClientRect().bottom - htmlElement.getBoundingClientRect().top 
            if(isTextAboveBottomOfPage){
                
                textToRemove = text.slice(startIndex + 1);
                
                const textToKeep = text.slice(0, startIndex+1);
                htmlElement.innerHTML = textToKeep
                break
            }
            if(startIndex===1){
                textToRemove = text 
                htmlElement.innerHTML = text
                deleteWhole = true
                break
            }

        }
        return {textToRemove, deleteWhole}
    };

    const isBr = (text: string, index: number) => {
        for(let i=-3; i<1; i++){
            if(index-i <0 || index+i>text.length-1 ) continue
            if(text[index+i]+text[index+i+1]+text[index+i+2]+text[index+i+3]==="<br>") return true
        }
        for(let i=-4; i<1; i++){
            if(index-i <0 || index+i>text.length-1 ) continue
            if(text[index+i]+text[index+i+1]+text[index+i+2]+text[index+i+3]+text[index+i+4]==="<br/>") return true
        }
        return false
    }

    useEffect(() => {
    // Calculate and update the pages when the component mounts or content changes
    updatePages();
    }, [editorValues.textDocument.value]);

      
      
    return (          
        <div ref={documentArea} style={{height: `calc(100vh - ${heightOfOffset}px)`}} className="document-container">
            <div  className="document-area">
            {editorValues.showRuler? <RulerHorizontal/> : null}                   
                <div style={{width: `${editorWidth+COMMENT_HOLDER_WIDTH+PRE_EDITOR_AREA+20}px`}} className="paper-area">
                    <div>{editorValues.showRuler? <RulerVertical/> : null}</div> 
                    <div ref={paperAreaRef} style={{width: PRE_EDITOR_AREA}} className="left-sidebar-container-content"></div>                 
                    <div onResize={(e)=>changeOffsetRuler()} ref={textEditorArea} className="paper-area-container" 
                        style={{transform: `scale(${editorValues.scale})`, width: `calc(( 100vw - ${COMMENT_HOLDER_WIDTH}px - 100px - 40px ) / ${parseInt(editorValues.scale)/100})`, transformOrigin: "left top"}}>                                                          
                        <div style={{zIndex: 0, height: `${numberPages*297}mm`}} className="backdrop">
                            <div ref={backdrop.highLightTextContainer} className="highlights"></div>
                        </div>
                        <ContentEditable
                            style={{height: `${numberPages*297}mm`}}
                            onPaste={(e)=>handlePaste(e)}
                            spellCheck={editorValues.spellCheck}
                            className="paper-doc"
                            innerRef={editorValues.markdownInput}
                            html={editorValues.textDocument.value} // innerHTML of the editable div
                        // use true to disable editing
                            onSelect={(e)=>editorUpdate.listenToSelectionChanges()}
                            onChange={(e)=>handleMarkdownChange(e)} // handle innerHTML change
                            contentEditable={true}
                        />
                        
                        <TableResizer cellInfo={cellResizeInfo} show={showTableCellResizer}></TableResizer>
                        <ImageResizer show={showImageResizer} imageResizerInfo={imageResizerInfo}/>
                        {Array.from({ length: numberPages-1}, (_, index) => (
                            <div key={`pageLine${index}`} style={{top: `${297*(index+1)}mm`}} className="page-line"></div>
                        ))}
                    </div>       
                    <div style={{width: `${COMMENT_HOLDER_WIDTH}px`,  position: "absolute",
                        left: editorWidth+PRE_EDITOR_AREA+20, top: 0}}> </div>             
                </div>
            </div>
        </div>   
    )
}




export default DocumentFormat;