"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendHorizontal, Mic, Square, RefreshCw } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

const ChatInput = ({ onSend, isStreaming, onStop }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const { isRecording, transcript, isSupported, startRecording, stopRecording, setTranscript } = useSpeechRecognition();

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, [text]);

  // When voice recording stops, add transcript to text
  useEffect(() => {
    if (!isRecording && transcript) {
      setText(prev => prev + (prev ? ' ' : '') + transcript);
      setTranscript('');
    }
  }, [isRecording, transcript, setTranscript]);

  const handleSend = useCallback(() => {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setText('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, isStreaming, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-bar">
        {isSupported && (
          <button
            onClick={toggleVoice}
            className={`chat-voice-btn ${isRecording ? 'recording' : ''}`}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'Listening...' : 'Message VoxNote...'}
          className="chat-input-textarea"
          rows={1}
          disabled={isStreaming}
        />

        {isStreaming ? (
          <button onClick={onStop} className="chat-stop-btn" title="Stop generating">
            <Square size={18} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className={`chat-send-btn ${text.trim() ? 'active' : ''}`}
            title="Send message"
          >
            <SendHorizontal size={18} />
          </button>
        )}
      </div>
      <p className="chat-input-hint">VoxNote can make mistakes. Verify important info.</p>
    </div>
  );
};

export default ChatInput;
