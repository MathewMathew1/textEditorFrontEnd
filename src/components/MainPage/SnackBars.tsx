import { useSnackbar, useUpdateSnackbar } from "../../contexts/SnackBarContext"
//TYPES
import "./SnackBars.css"

const SnackBars = () => {
    const snackBars = useSnackbar()
    const snackbarUpdate = useUpdateSnackbar()

    const handleClose = (id: number) => {
      snackbarUpdate.removeToastById(id)
    }
  
    return(
      <>
        {snackBars.snackBarsInfos.map((snackbar, index)=> {
          return(
            <div style={{bottom: `${index*70+50}px`, backgroundColor: snackbar.severity}} key={`toast ${index}`} className={`snackbar`}>
                <div>{snackbar.message}</div>
                <div onClick={()=>handleClose(snackbar.id)} className="close">x</div>
            </div>
        )})}  
      </>     
    )
}

export default SnackBars