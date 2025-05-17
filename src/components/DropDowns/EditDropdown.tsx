import { Delete, GoBack, GoForward, Cut, Copy, Paste, SelectAll, Replace } from "../../svgs/svgs";
import { useEditor } from "../../contexts/UseEditorProvider"
import useComponentVisible from "../../customhooks/useComponentVisiblity";
import { useCallback, useEffect } from "react";
import FindAndReplaceModal from "./FindAndReplaceModal";

const EditDropdown = () => {
    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible<HTMLDivElement>(false);
    const { ref: refModal, isComponentVisible: isModalOpen, setIsComponentVisible: setIsModalOpen} = useComponentVisible<HTMLDivElement>(false);
    const editorValues = useEditor()

    const cutText = () => {
        const selectedText = editorValues.savedSelection;

        if (selectedText) {
            navigator.clipboard.writeText(selectedText.toString());
            selectedText.deleteContents()
            editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, false)
        }
    }

    const copyText = () => {
        const selectedText = editorValues.savedSelection;

        if (selectedText) {
            navigator.clipboard.writeText(selectedText.toString());
        }
    }

    const handlePaste = () => {
        const selectedText = window.getSelection();
        if(!selectedText) return
        const range = selectedText.getRangeAt(0);
        navigator.clipboard.readText().then(text => {
          const textNode = document.createTextNode(text);
          range.deleteContents();
          range.insertNode(textNode);
          selectedText.removeAllRanges();
          selectedText.addRange(range);
          editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, false)
        });
        
    };
    
    const selectWholeContent = () => {
        const range = document.createRange();
        range.selectNodeContents(editorValues.markdownInput.current!);
        const selection = window.getSelection();
        selection!.removeAllRanges();
        selection!.addRange(range);
    }

    const deleteContent = () => {
        const selectedText = editorValues.savedSelection;
        if (selectedText) {
            selectedText.deleteContents()
            editorValues.textDocument.saveValue(editorValues.markdownInput.current!.innerHTML, true, false)
        }
    }

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
          if (event.ctrlKey && event.key === 'z') {
            event.preventDefault();
            editorValues.textDocument.undo();
            setIsComponentVisible(false)
          }
          if (event.ctrlKey && event.key === 'y') {
            event.preventDefault();
            editorValues.textDocument.redo();
            setIsComponentVisible(false)
          }
          if (event.ctrlKey && event.key === 'x' && isComponentVisible) {
            event.preventDefault();
            cutText()
            setIsComponentVisible(false)
          }
          if (event.ctrlKey && event.key === 'c' && isComponentVisible) {
            event.preventDefault();
            copyText()
            setIsComponentVisible(false)
          }
          if (event.ctrlKey && event.key === 'v' && isComponentVisible) {
            event.preventDefault();
            handlePaste()
            setIsComponentVisible(false)
          }
          if (event.ctrlKey && event.key === 'h' ) {
            event.preventDefault();
            setIsComponentVisible(true)
            setIsComponentVisible(false)
          }
          if (event.ctrlKey && event.key === 'a' && isComponentVisible) {
            event.preventDefault();
            selectWholeContent()
            setIsComponentVisible(false)
          }
        },
        [editorValues.textDocument]
      );
      const memoizedHandleKeyDown = useCallback(handleKeyDown, [editorValues.textDocument]);

      useEffect(() => {
        window.addEventListener('keydown', memoizedHandleKeyDown);
      
        return () => {
          window.removeEventListener('keydown', memoizedHandleKeyDown);
        };
      }, [memoizedHandleKeyDown]);

    return (
        <div className="dropdown" ref={ref} >
            <button className="button-div" onClick={()=>setIsComponentVisible(true)}>Edit</button>
            {isComponentVisible?
            <div onClick={()=>setIsComponentVisible(false)} style={{minWidth: "300px"}} className="dropdown-content">
               
              <button onClick={()=>editorValues.textDocument.undo()} className="button-div dropdown-option ">
                  <div><GoBack color={false}/></div>
                  <div  className="text-option-dropdown">Undo</div>
                  <div >Ctrl+Z</div>
              </button>
              <button onClick={()=>editorValues.textDocument.redo()} className="button-div dropdown-option ">
                  <div><GoForward color={false}/></div>
                  <div className="text-option-dropdown">Redo</div>
                  <div >Ctrl+Y</div>
              </button>
              <hr ></hr>
              <button onClick={()=>cutText()} disabled={editorValues.savedSelection?.collapsed} className="button-div dropdown-option">
                  <div><Cut/></div>
                  <div className="text-option-dropdown">Cut</div>
                  <div >Ctrl+X</div>
              </button>
              <button onClick={()=>copyText()} disabled={editorValues.savedSelection?.collapsed} className="button-div dropdown-option">
                  <div><Copy/></div>
                  <div className="text-option-dropdown">Copy</div>
                  <div >Ctrl+C</div>
              </button>
              <button onClick={()=>handlePaste()} className="button-div dropdown-option">
                  <div><Paste/></div>
                  <div className="text-option-dropdown">Paste</div>
                  <div >Ctrl+V</div>
              </button>
              <hr ></hr>
              <button onClick={()=>selectWholeContent()} className="button-div dropdown-option">
                  <div><SelectAll/></div>
                  <div className="text-option-dropdown">Select All</div>
                  <div >Ctrl+A</div>
              </button>
              <button onClick={()=>deleteContent()} className="button-div dropdown-option">
                  <div><Delete/></div>
                  <div className="text-option-dropdown">Delete</div>
              </button>
              <hr></hr>
              <button onClick={()=>setIsModalOpen(true)} className="button-div dropdown-option">
                  <div><Replace/></div>
                  <div className="text-option-dropdown">Find and replace</div>
                  <div >Ctrl+H</div>
              </button>
            </div>
            : 
            null
            }
            <FindAndReplaceModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} innerRef={refModal}/>
        </div>
    )
}

export default EditDropdown