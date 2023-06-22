import { useEffect, useState } from 'react';

const useDebounce = (value: any, delay: number, onSave: (debouncedValue: string) => void ) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (value !== debouncedValue) {
        event.preventDefault();
        onSave(debouncedValue);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [debouncedValue, onSave, value]);

  return debouncedValue;
};

export default useDebounce;