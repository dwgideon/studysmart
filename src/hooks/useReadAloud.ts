import { useCallback, useEffect, useRef, useState } from "react";

export function useReadAloud(rate: number) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState(-1);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {window.speechSynthesis.cancel();}
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {window.speechSynthesis.cancel();}
    utteranceRef.current = null;
    setSpeaking(false);
    setPaused(false);
    setActiveCharacter(-1);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {return;}
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.startsWith("en") && /samantha|ava|aria|google|microsoft/i.test(voice.name))
      ?? voices.find((voice) => voice.lang.startsWith("en"))
      ?? null;
    utterance.rate = Math.max(0.7, Math.min(1.1, rate));
    utterance.pitch = 1.06;
    utterance.onstart = () => {setSpeaking(true); setPaused(false); setActiveCharacter(0);};
    utterance.onboundary = (event) => {
      if (event.name === "word") {setActiveCharacter(event.charIndex);}
    };
    utterance.onend = () => {setSpeaking(false); setPaused(false); setActiveCharacter(-1);};
    utterance.onerror = () => {setSpeaking(false); setPaused(false); setActiveCharacter(-1);};
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [rate]);

  const togglePause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !utteranceRef.current) {return;}
    if (window.speechSynthesis.paused) {window.speechSynthesis.resume(); setPaused(false);}
    else {window.speechSynthesis.pause(); setPaused(true);}
  }, []);

  return { supported, speaking, paused, activeCharacter, speak, stop, togglePause };
}
