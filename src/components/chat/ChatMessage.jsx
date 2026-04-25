"use client";

import React, { useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

const ChatMessage = React.memo(({ message, isStreaming }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown-to-JSX renderer
  const renderMarkdown = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeLines = [];
    let codeLang = '';
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={key++} className="chat-code-block">
              <div className="chat-code-header">
                <span>{codeLang || 'code'}</span>
                <button onClick={() => navigator.clipboard.writeText(codeLines.join('\n'))} className="chat-code-copy">
                  <Copy size={12} />
                </button>
              </div>
              <pre><code>{codeLines.join('\n')}</code></pre>
            </div>
          );
          codeLines = [];
          codeLang = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLang = line.trim().slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Headings
      if (line.startsWith('## ')) {
        elements.push(<h3 key={key++} className="chat-md-h2">{renderInline(line.slice(3))}</h3>);
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(<h4 key={key++} className="chat-md-h3">{renderInline(line.slice(4))}</h4>);
        continue;
      }

      // Bullet list
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push(
          <div key={key++} className="chat-md-bullet">
            <span className="chat-md-bullet-dot">•</span>
            <span>{renderInline(line.trim().slice(2))}</span>
          </div>
        );
        continue;
      }

      // Numbered list
      const numMatch = line.trim().match(/^(\d+)\.\s(.+)/);
      if (numMatch) {
        elements.push(
          <div key={key++} className="chat-md-bullet">
            <span className="chat-md-num">{numMatch[1]}.</span>
            <span>{renderInline(numMatch[2])}</span>
          </div>
        );
        continue;
      }

      // Empty line = spacer
      if (line.trim() === '') {
        elements.push(<div key={key++} style={{ height: '8px' }} />);
        continue;
      }

      // Normal paragraph
      elements.push(<p key={key++} className="chat-md-para">{renderInline(line)}</p>);
    }

    // Handle unclosed code block
    if (inCodeBlock && codeLines.length > 0) {
      elements.push(
        <div key={key++} className="chat-code-block">
          <div className="chat-code-header">
            <span>{codeLang || 'code'}</span>
          </div>
          <pre><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
    }

    return elements;
  };

  // Inline markdown: **bold**, `code`, *italic*
  const renderInline = (text) => {
    if (!text) return text;
    const parts = [];
    let remaining = text;
    let k = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Inline code `code`
      const codeMatch = remaining.match(/`([^`]+)`/);

      let firstMatch = null;
      let firstIdx = Infinity;

      if (boldMatch && remaining.indexOf(boldMatch[0]) < firstIdx) {
        firstIdx = remaining.indexOf(boldMatch[0]);
        firstMatch = { type: 'bold', match: boldMatch };
      }
      if (codeMatch && remaining.indexOf(codeMatch[0]) < firstIdx) {
        firstIdx = remaining.indexOf(codeMatch[0]);
        firstMatch = { type: 'code', match: codeMatch };
      }

      if (!firstMatch) {
        parts.push(<span key={k++}>{remaining}</span>);
        break;
      }

      const idx = remaining.indexOf(firstMatch.match[0]);
      if (idx > 0) {
        parts.push(<span key={k++}>{remaining.slice(0, idx)}</span>);
      }

      if (firstMatch.type === 'bold') {
        parts.push(<strong key={k++} className="chat-md-bold">{firstMatch.match[1]}</strong>);
      } else if (firstMatch.type === 'code') {
        parts.push(<code key={k++} className="chat-md-inline-code">{firstMatch.match[1]}</code>);
      }

      remaining = remaining.slice(idx + firstMatch.match[0].length);
    }

    return parts;
  };

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
      {!isUser && (
        <div className="chat-avatar">
          <img src="/logo.png" alt="VoxNote" />
        </div>
      )}
      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="chat-md-content">
            {renderMarkdown(message.content)}
            {isStreaming && message.content && (
              <span className="chat-cursor-blink">▍</span>
            )}
            {!message.content && isStreaming && (
              <div className="chat-typing-indicator">
                <div className="chat-typing-dot" />
                <div className="chat-typing-dot" />
                <div className="chat-typing-dot" />
              </div>
            )}
          </div>
        )}
        {!isUser && message.content && !isStreaming && (
          <button className="chat-copy-btn" onClick={handleCopy} title="Copy">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;
