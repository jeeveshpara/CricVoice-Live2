import { useState, useEffect, useCallback, useRef } from "react";
import { fillerWords, defaultFillers } from "../data/fillerWords";

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    updateVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Algorithm: Dynamic filler word injector based on frequency slider (0-100)
  const injectDesiFillers = useCallback((text: string, frequency: number, languageCode: string): string => {
    if (frequency <= 5) return text;

    const chosenFillers = fillerWords[languageCode] || defaultFillers;
    const sentences = text.split(/([.!?।]+)/);
    const resultSentences: string[] = [];

    // Probability threshold of injecting a filler for each sentence gap
    const probability = frequency / 100;

    for (let i = 0; i < sentences.length; i++) {
      const segment = sentences[i];
      if (!segment) continue;

      if (segment.trim().length > 3 && Math.random() < probability) {
        // Pick random exclamation filler word
        const randomFiller = chosenFillers[Math.floor(Math.random() * chosenFillers.length)];
        // Add random filler prefix
        resultSentences.push(`${randomFiller} ${segment}`);
      } else {
        resultSentences.push(segment);
      }
    }

    return resultSentences.join("").replace(/\s+/g, " ").trim();
  }, []);

  const speak = useCallback((
    text: string,
    languageCode: string,
    pitch: number = 1.0,
    rate: number = 1.0,
    volume: number = 1.0
  ) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop pre-existing playbacks
    setIsSpeaking(true);
    setIsPaused(false);
    setCurrentWordIndex(-1);

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;

    // Track best voice matching locale
    const mappedLocales: Record<string, string> = {
      hi: "hi-IN",
      bn: "bn-IN",
      mr: "mr-IN",
      ta: "ta-IN",
      te: "te-IN",
      pa: "pa-IN",
      gu: "gu-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      ur: "ur-PK"
    };
    
    const targetLocale = mappedLocales[languageCode] || "en-IN";
    const matchingVoice = voices.find(v => v.lang.startsWith(targetLocale) || v.lang.startsWith(languageCode)) 
                          || voices.find(v => v.lang.includes("IN"))
                          || voices[0];
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        // Count approximate words to highlight correctly in screen
        const textBefore = text.slice(0, charIndex);
        const splitWords = textBefore.trim().split(/\s+/);
        setCurrentWordIndex(textBefore.trim() === "" ? 0 : splitWords.length);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const pause = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    }
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    currentWordIndex,
    injectDesiFillers
  };
}
