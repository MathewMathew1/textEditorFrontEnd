import { useState, createContext, useContext, useEffect } from "react";
import { changeTextRoute, changeTitleRoute, deleteCookieRoute, getTextDocumentsRoute, healthCheckRoute, textDocumentTemplatesRoute, textDocumentsRoute, userDataRoute } from "../routes";
import { userData, TextDocument, severityColors } from "../types";
import { purifyDocument } from "../Utilities/purify";
import { useUpdateSnackbar } from "./SnackBarContext";
import useArray from "../customhooks/useArray";

type UserContextProps = {    
    logged: boolean; 
    fetchingUserDataFinished: boolean;
    userInfo: userData|undefined;
    userSignature: string
    userDocuments: TextDocument[]
    templates: {
        template: string;
        templateName: string;
    }[]
}

type UserUpdateContextProps = {
    logout: () => void  
    createNewDocument: (text: string, title: string) => Promise<null|string>
    changeTitle: (idOfDocument: string, title: string, storedInDatabase?: boolean) => void
    deleteDocument: (idOfDocument: string, storedInDatabase?: boolean) => void
    saveDocument: (text: string, id: string, storedInDatabase?: boolean) => void
}    

const UserContext = createContext({} as UserContextProps)
const UserUpdate = createContext({} as UserUpdateContextProps)


export function useUser(){
    return useContext(UserContext)
}

export function useUserUpdate(){
    return useContext(UserUpdate)
}

const UserProvider = ({ children }: {children: React.ReactNode}): JSX.Element => {
    const[logged, setLogged] = useState(false)
    const[userInfo, setUserInfo] = useState<userData>()
    const[fetchingUserDataFinished, setFetchingUserDataFinished] = useState(false)
    const[userSignature, setUserSignature] = useState("")
    const [templates, setTemplates] = useState<{template: string, templateName: string}[]>([])
    const userDocuments = useArray<TextDocument>([])
    const updateSnackBars = useUpdateSnackbar()

    const controller = new AbortController()

    useEffect(() => {
        const { signal } = controller;
    
        fetch(healthCheckRoute, {
            method: 'GET',
            signal,
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(response => {
          if (!response.ok) {
            updateSnackBars.addSnackBar({snackbarText: "Server is currently down, site wont work correctly", severity: severityColors.error})
          }
        })
        .catch((error) => {
            updateSnackBars.addSnackBar({snackbarText: "Server is currently down, site wont work correctly", severity: severityColors.error})
            console.log(error)
        })
      }, [])

    useEffect(() => {
        const { signal } = controller
        fetch(userDataRoute,{
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
                loadDocuments(false)
                return
            }
            const userData = response.userData
            const userSignature = userData?.username?userData?.username: userData?.email? userData?.email: userData?.google
            setUserSignature(userSignature)
            setUserInfo(response.userData)
            setLogged(true)
            loadDocuments(true)
        })
        .catch(error=>{console.log(error)})
        .finally(()=>setFetchingUserDataFinished(true))
    }, []);

    const loadDocuments = (userLogged: boolean) => {
        if(userLogged){
            const { signal } = controller
            fetch(textDocumentsRoute,{
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
                    setFetchingUserDataFinished(true)
                    return
                }
          
                userDocuments.set(response.textDocuments)
                setFetchingUserDataFinished(true)
            })
            .catch(error=>{console.log(error)})
        }else{
            let storedDocuments = localStorage.getItem("documents");
            if(!storedDocuments){
                setFetchingUserDataFinished(true)
                return
            }
            let storedDocumentsParsed: TextDocument[] = JSON.parse(storedDocuments)
            userDocuments.set(storedDocumentsParsed)
            setFetchingUserDataFinished(true)
        }
    }

    useEffect(() => {
        document.title = 'Main Page';
        const { signal } = controller
        fetch(textDocumentTemplatesRoute,{
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
                return
            }
            setTemplates(response.templates)
        })
        .catch(error=>{console.log(error)})
    }, []);


    const changeTitle = (idOfDocument: string, title: string, storedInDatabase?: boolean) => {
        storedInDatabase = storedInDatabase? storedInDatabase: logged
        if(storedInDatabase){
            const { signal } = controller

            const body = {
                "title": title,
            }
            fetch(changeTitleRoute+idOfDocument,{
                method: "PATCH",
                signal,
                body: JSON.stringify(body),
                credentials: 'include',
                headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                }})
                .then(response =>response.json())
                .then(response => {
                    if(response.error){
                        updateSnackBars.addSnackBar({snackbarText: "Unable to update title try again", severity: severityColors.error})
                        return
                    }
                    userDocuments.updateObjectByKey("_id", idOfDocument, [{field: "title", fieldValue: title}] )
                  
                })
                .catch((error)=>{console.log(error)})
        }else{
            
            let storedDocuments = localStorage.getItem("documents");
            if(storedDocuments){
                let newUpdatedDocuments: TextDocument[] = []
                let storedDocumentsParsed: TextDocument[] = JSON.parse(storedDocuments)
                newUpdatedDocuments = storedDocumentsParsed
                const index = storedDocumentsParsed.findIndex(document=>document._id===idOfDocument)
                if(index!==-1){
                    storedDocumentsParsed[index].title = title
                    userDocuments.updateObjectByKey("_id", idOfDocument, [{field: "title", fieldValue: title}] )
                }else{
                    updateSnackBars.addSnackBar({snackbarText: "Unable to update title try again", severity: severityColors.error})
                }
            }
        }
    }

    const deleteDocument = (idOfDocument: string, storedInDatabase?: boolean) => {
        storedInDatabase = storedInDatabase? storedInDatabase: logged
        if(storedInDatabase){
            const { signal } = controller
            fetch(getTextDocumentsRoute+idOfDocument,{
                method: "DELETE",
                signal,
                credentials: 'include',
                headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                }})
                .then(response =>response.json())
                .then(response => {
                    if(response.error){
                        updateSnackBars.addSnackBar({snackbarText: "Unable to delete document", severity: severityColors.error})
                        return
                    }
                    userDocuments.removeByKey("_id", idOfDocument)
                  
                })
                .catch((error)=>{console.log(error)})
        }else{
            let storedDocuments = localStorage.getItem("documents");
            if(storedDocuments){
                
                let storedDocumentsParsed: TextDocument[] = JSON.parse(storedDocuments)

                const index = storedDocumentsParsed.findIndex(document=>document._id===idOfDocument)
                if(index!==-1){
                    storedDocumentsParsed.splice(index, 1)
                    userDocuments.removeByKey("_id", idOfDocument)
                    localStorage.setItem("documents", JSON.stringify(storedDocumentsParsed))
                }else{
                    updateSnackBars.addSnackBar({snackbarText: "Unable to delete document", severity: severityColors.error})
                }
            }
        }
    }

    const createNewDocument = async (text: string, title: string) => {
        if(logged){
            try {
                const body = {
                    text,
                    title,
                };
                const { signal } = controller;
                
                const response = await fetch(textDocumentsRoute, {
                  method: "POST",
                  signal,
                  credentials: 'include',
                  headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': "Bearer " + localStorage.getItem("token") || "",
                  },
                  body: JSON.stringify(body),
                });
                const json = await response.json();
             
                if (json.error) {
                    updateSnackBars.addSnackBar({snackbarText: "Unable to create new text Document, try again", severity: severityColors.error})
                    return null;
                } else {
                    userDocuments.push(json.textDocument)
                  return json.textDocument._id;
                }
            } catch (error) {
                updateSnackBars.addSnackBar({snackbarText: "Unable to create new text Document, try again", severity: severityColors.error})
                console.error(error);
                return null;
            }
        }
        const newText = await purifyDocument(text)
        if(!newText){
            updateSnackBars.addSnackBar({snackbarText: "Unable to create new text Document, try again", severity: severityColors.error})
            return null
        }
        
        const newDocument: TextDocument ={
            title,
            text: newText,
            _id: findLowestMissingId().toString(),
            lastUpdatedAt: new Date().toString(),
        } 
        
        let newUpdatedDocuments: TextDocument[] = []
        let storedDocuments = localStorage.getItem("documents");
        if(storedDocuments){
            let storedDocumentsParsed: TextDocument[] = JSON.parse(storedDocuments)
            newUpdatedDocuments = storedDocumentsParsed
            newUpdatedDocuments.push(newDocument)
        }else{
            newUpdatedDocuments.push(newDocument)
        }
        userDocuments.push(newDocument)
  
        localStorage.setItem("documents", JSON.stringify(newUpdatedDocuments))

        return newDocument._id
    }

    const findLowestMissingId = (): number => {
        const ids = userDocuments.array.map(obj => parseInt(obj._id));
        let missingId = 0;
      
        while (ids.includes(missingId)) {
          missingId++;
        }
      
        return missingId;
      }
  
    const logout = () => {
        const { signal } = controller;

        fetch(deleteCookieRoute, {
            method: 'DELETE',
            credentials: 'include',
            signal,
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .catch((error) => {
            console.log(error)
        }).finally(()=>{
            window.location.href = "/"
        })

    }

    const saveDocument = (text: string, id: string, storedInDatabase?: boolean) => {
        storedInDatabase = storedInDatabase? storedInDatabase: logged
        if (storedInDatabase) {
            const body = {
                text,
            };

            const { signal } = controller;
            // Send POST request to server
            fetch(changeTextRoute + id, {
            method: 'PATCH',
            credentials: 'include',
            signal,
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                // Add any additional headers if required
            },
            })
            .catch((error) => {
                console.log(error)
            });
        } else {
            let storedDocuments = localStorage.getItem("documents");
            if(storedDocuments){
                let newUpdatedDocuments: TextDocument[] = []
                let storedDocumentsParsed: TextDocument[] = JSON.parse(storedDocuments)
                newUpdatedDocuments = storedDocumentsParsed
                const index = storedDocumentsParsed.findIndex(document=>document._id===id)
                if(index!==-1){
                    storedDocumentsParsed[index].text = text
                    userDocuments.updateObjectByKey("_id", id, [{field: "text", fieldValue: text}] )
                    localStorage.setItem("documents", JSON.stringify(storedDocumentsParsed))
                }
            }
        }
    };
    
    return (
        <UserContext.Provider value={{logged, fetchingUserDataFinished, userInfo, userSignature, 
            userDocuments: userDocuments.array, templates }}>
            <UserUpdate.Provider value={{logout, createNewDocument, changeTitle, deleteDocument, saveDocument}}>
                {children}   
            </UserUpdate.Provider>
        </UserContext.Provider>
    )
}

export default UserProvider