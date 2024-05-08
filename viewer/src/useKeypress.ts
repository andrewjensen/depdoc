import { useEffect, useRef } from "react";

type KeypressHandlerFn = (event: KeyboardEvent) => void;

const useKeypress = (keys: string[], handler: KeypressHandlerFn): void => {
  const eventListenerRef = useRef();

  useEffect(() => {
    eventListenerRef.current = (event: KeyboardEvent) => {
      if (keys.includes(event.key)) {
        handler?.(event);
      }
    };
  }, [keys, handler]);

  useEffect(() => {
    const eventListener = (event: KeyboardEvent) => {
      eventListenerRef.current(event);
    };
    window.addEventListener("keydown", eventListener);
    return () => {
      window.removeEventListener("keydown", eventListener);
    };
  }, []);
};

export default useKeypress;
