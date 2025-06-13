import { useState, useEffect } from 'react';

// A hook to persist state in localStorage with SSR safety
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => initialValue);

  // SSR check
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);

      // Parse stored json or if none return initialValue
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        // If no stored value exists, set initial value in localStorage
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      }
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Only attempt to save to localStorage on the client
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
