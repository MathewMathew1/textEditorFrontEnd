import { TextDocument } from '../types';
import { useUser } from '../contexts/UserContext';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTextDocumentsRoute} from '../routes';
import LoadingCircle from './MainPage/LoadingCircle';
import Editor from './Editor';
import NotFound from './MainPage/NotFound';
import UserInfo from './Authorization/UserInfo';
import { purifyDocument } from '../Utilities/purify';
import FileBar from './Filebar';
import Toolbar from './Toolbar';
import DocumentFormat from './DocumentFormat';
import BackdropProvider from '../contexts/BackdropContext';

const TextDocumentComponent = () => {
    const user = useUser()
    const controller = new AbortController()
    const [finishLoading, setFinishLoading] = useState(false)
    const [document, setDocument] = useState<TextDocument|undefined>(undefined)
    const [storedInDatabase, setStoredInDatabase] = useState(false)
    const params = useParams()
    
    useEffect(() => {
        const getTextDocument = async () => {
            setStoredInDatabase(user.logged)
            const id = params.id
            
            if(user.logged){     
                const { signal } = controller
                fetch(getTextDocumentsRoute+id,{
                    method: "GET",
                    signal,
                    credentials: 'include',
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8',
                        'Authorization': "Bearer " + localStorage.getItem("token") || "",
                        
                    }})
                .then(response => response.json())
                .then(response => {
                    if(response.error){   
                        setDocument(undefined)
                        return              
                    }else{
                        setDocument(response.textDocument)
                    }
                })
                .catch(error=>{console.log(error)})
                .finally(()=>setFinishLoading(true))
            }
            else{
                let storedDocuments = localStorage.getItem("documents");
                if(!storedDocuments){
                    setFinishLoading(true)
                    return
                }
                let storedDocumentsParsed: TextDocument[] = JSON.parse(storedDocuments)
                let foundDocument = storedDocumentsParsed.find((document)=>document._id===id)
                if(foundDocument){
                    const newText = await purifyDocument(foundDocument.text)
                    if(!newText) {
                        foundDocument = undefined
                    } 
                    else {
                        foundDocument.text = newText
                    }
                    
                    setDocument(foundDocument)
                }  
                setFinishLoading(true)
            }
        }
        if(user.fetchingUserDataFinished){
            getTextDocument()
        }
    }, [user.fetchingUserDataFinished, params.id]);

    return (          
        <>
        {finishLoading?
            <>
                {document?
                    <Editor storedInDatabase={storedInDatabase} originalDocument={document}>
                        <BackdropProvider>
                            <div className="flex">
                                <FileBar></FileBar>
                                <Toolbar></Toolbar>
                                <DocumentFormat></DocumentFormat>
                            </div>
                        </BackdropProvider>
                    </Editor>
                    :
                    <div>
                        <div><UserInfo/></div>
                        <NotFound/>
                    </div>
                }
            </>
            :
            <LoadingCircle/>
        }
        </> 
    )
}




export default TextDocumentComponent;