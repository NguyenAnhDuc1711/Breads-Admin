import { useEffect, useState } from "react";

const useDebounce = (value: string, time = 500): string => {
  const [debounceValue, setDebounceValue] = useState<string>(value);
  useEffect(() => {
    const timeOut = setTimeout(() => {
      setDebounceValue(value);
    }, time ?? 500);
    return () => {
      clearTimeout(timeOut);
    };
  }, [value, time]);
  return debounceValue;
};

export default useDebounce;
