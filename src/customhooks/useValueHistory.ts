import { useState, useEffect } from 'react';

const useValueHistory = <T>(initialValue: T, storageName?: string|undefined) => {
  // Define the state variable and its setter function
  const [value, setValue] = useState<T>(initialValue);
  const [history, setHistory] = useState<T[]>([initialValue])
  const [valueFromLocalHostStored, setValueFromLocalHostStored] = useState(false)
  // Store the 5 latest values in an array
  
  const updateHistory = async (newValue: T) => {
    const waitForValue = () =>
    new Promise((resolve) => {
      const checkValue = () => {
        if (valueFromLocalHostStored) {
          resolve(()=>{});
        } else {
          setTimeout(checkValue, 100); // Retry after 100 milliseconds
        }
      };
      checkValue();
    });

    await waitForValue();
    let index = history.findIndex((value)=>value===newValue)
    
    if(index === -1){
        setHistory(prevHistory => {
            const newHistory = [newValue, ...prevHistory.slice(0, 4)]
            if(storageName!==undefined) localStorage.setItem(storageName, JSON.stringify(newHistory))

            return [newValue, ...prevHistory.slice(0, 4)]
        } )
        return
    }
    setHistory(prevHistory => {
        const newHistory = [newValue, ...prevHistory.slice(0, index), ...prevHistory.slice(index+1, 5)]
        if(storageName!==undefined) localStorage.setItem(storageName, JSON.stringify(newHistory))
        
        return [newValue, ...prevHistory.slice(0, index), ...prevHistory.slice(index+1, 5)]
    })

  };

  useEffect(() => {
    
    if(storageName===undefined) return

    let storedNames = localStorage.getItem(storageName);
    setValueFromLocalHostStored(true)
    if(storedNames === null) return
    let storedNameParsed: T[] = JSON.parse(storedNames)

    setHistory(storedNameParsed)
    setValue(storedNameParsed[0])
  }, [storageName]);

  // When the value is updated, push it to the history array
  const setValueWithHistory = (newValue: T) => {
    updateHistory(newValue);
    setValue(newValue);
  };

  return {
    value,
    setValue: setValueWithHistory,
    history
  };
}

export default useValueHistory