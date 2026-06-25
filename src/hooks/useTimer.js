import { useState, useEffect, useRef } from 'react';

export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(document.hasFocus());
  const startRef = useRef(null);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    function onFocus() {
      setIsRunning(true);
      startRef.current = Date.now();
    }
    function onBlur() {
      setIsRunning(false);
      if (startRef.current) {
        accumulatedRef.current += Date.now() - startRef.current;
        startRef.current = null;
      }
    }
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    if (document.hasFocus()) startRef.current = Date.now();
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const current = startRef.current ? Date.now() - startRef.current : 0;
      setElapsed(accumulatedRef.current + current);
    }, 500);
    return () => clearInterval(interval);
  }, [isRunning]);

  return { elapsed, isRunning };
}
