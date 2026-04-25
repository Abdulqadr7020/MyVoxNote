"use client";

import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

const ChatThread = ({ messages, isStreaming }) => {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  if (!messages || messages.length === 0) {
    return (
      <div className="chat-empty-state">
        <div className="chat-empty-orb-wrapper">
          <div className="chat-empty-orb">
            <img src="/logo.png" alt="VoxNote" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          </div>
        </div>
        <h2 className="chat-empty-title">How can I help you today?</h2>
        <p className="chat-empty-subtitle">Ask me anything — studying, coding, research, brainstorming, or just chat.</p>
        <div className="chat-suggestion-grid">
          {[
            { icon: '📝', text: 'Help me study for my exam' },
            { icon: '💡', text: 'Explain a complex concept' },
            { icon: '🧑‍💻', text: 'Write & debug code' },
            { icon: '📊', text: 'Analyze data or research' },
          ].map((s, i) => (
            <div key={i} className="chat-suggestion-chip" style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="chat-suggestion-icon">{s.icon}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-thread" ref={scrollRef}>
      <div className="chat-thread-inner">
        {messages.map((msg, idx) => (
          <ChatMessage
            key={idx}
            message={msg}
            isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatThread;
