import { useState, useEffect, useRef, useCallback } from 'react';

// Type definitions for SpeechRecognition API
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultAlternative {
  [index: number]: SpeechRecognitionResultItem;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionResultListType {
  [index: number]: SpeechRecognitionResultAlternative;
  length: number;
}

interface SpeechRecognitionEventType extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListType;
}

interface SpeechRecognitionErrorEventType extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEventType) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEventType) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseSpeechToTextOptions {
  onTranscriptChange?: (transcript: string) => void;
  lang?: string;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { onTranscriptChange, lang = 'en-US' } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isExplicitStopRef = useRef(false);
  const baseTextRef = useRef('');

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    isExplicitStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback((initialText: string = '') => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Speech-to-text is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Safe ignore
      }
    }

    baseTextRef.current = initialText.trim();
    isExplicitStopRef.current = false;
    setError(null);

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEventType) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const textChunk = result[0]?.transcript || '';
          if (result.isFinal) {
            currentFinal += textChunk;
          } else {
            currentInterim += textChunk;
          }
        }

        if (currentFinal) {
          const prefix = baseTextRef.current ? `${baseTextRef.current} ` : '';
          const newFull = `${prefix}${currentFinal.trim()}`;
          baseTextRef.current = newFull;
          setTranscript(newFull);
          if (onTranscriptChange) {
            onTranscriptChange(newFull);
          }
        }

        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
        if (event.error === 'no-speech') {
          // Normal timeout if user was silent for a bit; don't report as hard error
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else if (event.error === 'network') {
          setError('Speech recognition network error. Please check your internet connection.');
        } else if (event.error !== 'aborted') {
          setError(`Speech recognition notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setInterimTranscript('');
        // If user didn't explicitly stop and we're not unmounted, allow restart or settle
        if (!isExplicitStopRef.current) {
          setIsListening(false);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setError(err?.message || 'Failed to initialize microphone speech recognition.');
      setIsListening(false);
    }
  }, [lang, onTranscriptChange]);

  const toggleListening = useCallback((currentInput: string = '') => {
    if (isListening) {
      stopListening();
    } else {
      startListening(currentInput);
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Safe ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearError: () => setError(null),
  };
}
