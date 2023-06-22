import { useState } from "react";

const MAX_HISTORY_LENGTH = 100;

const useHistorySaver = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);
  const [history, setHistory] = useState([initialValue]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lastChangeWasSingular, setLastChangeWasSingular] = useState(true)
  const [lastChangeTimeStamp, setLastChangeTimeStamp] = useState<null|number>(null)

  const saveValue = (newValue: string, changeHistory: boolean, singularChange: boolean, alwaysOverwrite?: boolean) => {
    if (value === newValue) {
      return;
    }

    const solidAmountOfTimePassedSinceLastChange = lastChangeTimeStamp === null ||  Date.now()- lastChangeTimeStamp > 5000
    const updateHistoryWithNewStack = changeHistory || solidAmountOfTimePassedSinceLastChange || lastChangeWasSingular || historyIndex !== history.length-1
    setLastChangeTimeStamp(Date.now())
    setLastChangeWasSingular(singularChange)

    if(!updateHistoryWithNewStack || alwaysOverwrite===true){
      setHistory((prevHistory) => [
        ...prevHistory.slice(0, historyIndex), // remove value
        newValue,
        ...prevHistory.slice(historyIndex+1, prevHistory.length)
      ])
      setValue(newValue);
      return
      
    }

    const newHistory = [...history.slice(0, historyIndex + 1), newValue].slice(
      -MAX_HISTORY_LENGTH
    );

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setValue(newValue);
  }

  const reset = (newValue: string) => {
    const newHistory = [newValue]
    setHistory(newHistory);
    setHistoryIndex(0);
    setValue(newValue);
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setValue(history[historyIndex - 1]);
    }
  }

  const redo = () =>  {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setValue(history[historyIndex + 1]);
    }
  }

  return {value, saveValue, undo, redo, reset};
}

export default useHistorySaver;

