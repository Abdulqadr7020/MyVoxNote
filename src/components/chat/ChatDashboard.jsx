"use client";

import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useChatStore } from '../../hooks/useChatStore';
import ChatSidebar from './ChatSidebar';
import ChatThread from './ChatThread';
import ChatInput from './ChatInput';

const ChatDashboard = ({ session, selectedProvider: globalProvider, selectedModel: globalModel }) => {
  const {
    conversations,
    activeConversation,
    activeId,
    isStreaming,
    createConversation,
    switchConversation,
    deleteConversation,
    sendMessage,
    stopStreaming,
    // Model selection
    selectedProvider,
    selectedModel,
    availableProviders,
    handleModelChange,
  } = useChatStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync global model selection with chat store
  useEffect(() => {
    if (globalProvider && globalModel) {
      handleModelChange(globalProvider, globalModel);
    }
  }, [globalProvider, globalModel, handleModelChange]);

  return (
    <div className="chat-layout">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={switchConversation}
        onCreate={createConversation}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="chat-main">
        {/* Mobile menu trigger */}
        <button
          className="chat-mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>

        {/* Model Selector moved to header */}

        <ChatThread
          messages={activeConversation?.messages || []}
          isStreaming={isStreaming}
        />

        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          onStop={stopStreaming}
        />
      </div>
    </div>
  );
};

export default ChatDashboard;
