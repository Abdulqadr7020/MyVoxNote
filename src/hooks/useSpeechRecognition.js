import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeechRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const previousTranscriptRef = useRef('');
  const transcriptRef = useRef('');

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const createRecognition = useCallback(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Voice service started');
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Maintain the previous sessions' text
      const prevText = previousTranscriptRef.current;
      
      // Update session state
      let currentSessionText = '';
      for (let i = 0; i < event.results.length; i++) {
        currentSessionText += event.results[i][0].transcript;
      }
      
      const sessionText = currentSessionText.trim();
      const newFullTranscript = prevText + (prevText && sessionText ? ' ' : '') + sessionText;
      
      if (newFullTranscript !== transcriptRef.current) {
        setTranscript(newFullTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Voice error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied.');
        setIsRecording(false);
        isRecordingRef.current = false;
      } else if (event.error !== 'no-speech') {
        setError(event.error);
      }
    };

    recognition.onend = () => {
      console.log('Voice session ended');
      previousTranscriptRef.current = transcriptRef.current;

      if (isRecordingRef.current) {
        // Force a fresh restart after a tiny break
        setTimeout(() => {
          if (isRecordingRef.current) {
            startEngine();
          }
        }, 150);
      } else {
        setIsRecording(false);
      }
    };

    return recognition;
  }, []);

  const startEngine = useCallback(() => {
    if (recognitionRef.current) {
       try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    const recognition = createRecognition();
    if (!recognition) return;
    
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start:', e);
    }
  }, [createRecognition]);

  const startRecording = useCallback(() => {
    setError(null);
    setTranscript('');
    previousTranscriptRef.current = '';
    transcriptRef.current = '';
    setIsRecording(true);
    isRecordingRef.current = true;
    startEngine();
  }, [startEngine]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return { 
    isRecording, 
    transcript, 
    isSupported, 
    error, 
    startRecording, 
    stopRecording, 
    setTranscript 
  };
};

