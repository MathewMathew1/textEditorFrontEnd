import { useState, useEffect } from "react";
import "./FindAndReplaceModal.css";
import { useBackdrop, useBackdropUpdate } from "../../contexts/BackdropContext";

const FindAndReplaceModal= ({isModalOpen, setIsModalOpen, innerRef}: {
        setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>, 
        isModalOpen: boolean, 
        innerRef: React.RefObject<HTMLDivElement>
    }) => {
    const [replaceText, setReplaceText] = useState("")
    const backdropUpdate = useBackdropUpdate()
    const backdrop = useBackdrop()
    
    useEffect(() => {
        backdropUpdate.setIsTextBeingSearched(isModalOpen)
    }, [isModalOpen]);

    return (
        <>
            {isModalOpen?
                <div className="find-and-replace-modal" ref={innerRef}>
                    <div className="link-input-container">
                        <h2>Find and replace</h2>
                        <div className="inputs-container">
                            <div className="input-group">
                                <label htmlFor="FindText" >Find</label>
                                <div className="input-container">
                                    <input id="FindText" value={backdrop.searchedText} 
                                        onChange={(e)=>backdropUpdate.setSearchedText(e.target.value)} className="link-input"></input>
                                    <div className="end-text">{backdrop.currentInstance} of {backdrop.instances}</div>
                                </div>
                            </div>
                            <div className="input-group">
                                <label htmlFor="ReplaceText" >Replace With</label>
                                <input id="ReplaceText" value={replaceText} onChange={(e)=>setReplaceText(e.target.value)} className="link-input"></input>
                            </div>              
                        </div>
                        <div className="checkbox-container">
                                <input
                                    id="MatchCases"
                                    checked={backdrop.matchCase}
                                    onChange={(event) => backdropUpdate.setMatchCase(event.target.checked)}
                                    type="checkbox"
                                />
                            <label htmlFor="MatchCases">    
                                Match cases
                            </label>
                        </div>     
                        <div className="far-button-group">
                            <button onClick={()=>backdropUpdate.replaceAllOccurrences(replaceText, backdrop.currentInstance)} className="btn cancel" disabled={backdrop.currentInstance===0}>Replace</button>
                            <button className="btn cancel" onClick={()=>backdropUpdate.replaceAllOccurrences(replaceText)} 
                                disabled={backdrop.instances===0}>Replace All</button>
                            <button onClick={()=>backdropUpdate.highlightNext(-1)} className="btn apply" disabled={backdrop.instances===0}>Previous</button>
                            <button onClick={()=>backdropUpdate.highlightNext(1)} className="btn apply" disabled={backdrop.instances===0}>Next</button>
                        </div>
                    </div>
                </div>
            :
                null
            }
        </>
        
    )
}




export default FindAndReplaceModal;