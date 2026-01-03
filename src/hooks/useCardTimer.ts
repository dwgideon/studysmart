import { useEffect, useRef, useState } from "react";

export function useCardTimer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    if (intervalRef.current) return;
    setSeconds(0);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return { seconds, start, stop };
}
