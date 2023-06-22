import { createContext, useContext, useEffect, useState, } from "react";
import useArray from "../customhooks/useArray";
import { severityColors } from "../types";

const SNACKBAR_SCREEN_TIME = 5000
const MAXIMUM_AMOUNT_OF_SNACKBARS = 3
let idOfNextToast = 1

export type SnackbarInfo = {
    message: string,
    severity: severityColors
    id: number
}

type SnackbarContextProps = {    
    snackBarsInfos: SnackbarInfo[]
}

type SnackbarUpdateProps = {    
    addSnackBar: ({snackbarText, severity}: {snackbarText: string, severity: severityColors}) => void
    removeToastById: (index: number) => void
}

const SnackbarContext = createContext({} as SnackbarContextProps)
const SnackbarUpdate = createContext({} as SnackbarUpdateProps)

export function useSnackbar(){
    return useContext(SnackbarContext)
}

export function useUpdateSnackbar(){
    return useContext(SnackbarUpdate)
}

const SnackbarProvider = ({ children }: {children: any}): JSX.Element => {
    const snackBarInfos = useArray<SnackbarInfo>([])
    const [idToDelete, setIdToDelete] = useState<number|null>(null)

    useEffect(() => {
        let snackbarInfo = sessionStorage.getItem("snackbar")
        if(snackbarInfo){
            sessionStorage.removeItem("snackbar")
            let snackbarInfoParsed: SnackbarInfo = JSON.parse(snackbarInfo)
            addSnackBar({snackbarText: snackbarInfoParsed.message, severity: snackbarInfoParsed.severity})
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addSnackBar = ({snackbarText, severity}: {snackbarText: string, severity: severityColors}): void => {
        if(snackBarInfos.array.length >= MAXIMUM_AMOUNT_OF_SNACKBARS){
            snackBarInfos.removeValueByIndex(0)
        }
        snackBarInfos.push({message: snackbarText, severity, id: idOfNextToast})
        let idOfCreatedToast = idOfNextToast
        idOfNextToast += 1
        setTimeout(() => setIdToDelete(idOfCreatedToast)
        , SNACKBAR_SCREEN_TIME)
    }
    
    useEffect(() => {

        if(idToDelete==null) return
        removeToastById(idToDelete)
        setIdToDelete(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idToDelete]);

    const removeToastById = (id: number) => {
        snackBarInfos.removeByKey("id", id)
    }

    return (
        <SnackbarContext.Provider value={{snackBarsInfos: snackBarInfos.array}}>
            <SnackbarUpdate.Provider value={{addSnackBar, removeToastById}}>
                {children}   
            </SnackbarUpdate.Provider>
        </SnackbarContext.Provider>
    )
}

export default SnackbarProvider