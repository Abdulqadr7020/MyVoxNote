"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, SendHorizontal, Eraser, History } from 'lucide-react';
import Recorder from './Recorder';
import ResultsDisplay from './ResultsDisplay';
import ExportBar from './ExportBar';
import FocusHistoryPanel from './FocusHistoryPanel';
import ModelSelector from './ModelSelector';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useFocusHistory } from '../hooks/useFocusHistory';
import { formatSpeechWithAI } from '../services/ai';
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from '../config/aiProviders';

const FocusMode = ({ session, isDark, showAuthModal, setShowAuthModal, selectedProvider, selectedModel, availableProviders = [] }) => {
  const { isRecording, transcript, isSupported, error: recognitionError, startRecording, stopRecording, setTranscript } = useSpeechRecognition();
  const { history, saveSession, deleteSession, clearAll } = useFocusHistory();

  const [isProcessing, setIsProcessing] = useState(false);
  const [formattedData, setFormattedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [restoredToast, setRestoredToast] = useState(false);
  const toastTimerRef = useRef(null);
  const [displayText, setDisplayText] = useState('');

  // Model state is now passed as props from Home

  useEffect(() => {
    if (recognitionError) {
      setErrorMsg(`Voice Error: ${recognitionError}`);
    } else if (errorMsg.startsWith('Voice Error:')) {
      setErrorMsg('');
    }
  }, [recognitionError]);

  useEffect(() => {
    if (!isSupported) {
      setErrorMsg("Your browser does not support Speech Recognition. Please try Chrome or Edge.");
    }
  }, [isSupported]);

  // Cleanup toast timer on unmount
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const showRestoredToast = useCallback(() => {
    setRestoredToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setRestoredToast(false), 2800);
  }, []);

  const processTranscript = useCallback(async (textToProcess) => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const result = await formatSpeechWithAI(textToProcess, 'default', selectedProvider, selectedModel);
      setFormattedData(result);
      // Auto-save to history after successful analysis
      saveSession(textToProcess, result);
    } catch (e) {
      const msg = e.message || 'Failed to format speech.';
      // Detect rate limiting and suggest switching models
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
        setErrorMsg('⚡ Rate limited — try switching to a different AI model.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [saveSession, selectedProvider, selectedModel]);

  const handleStartRecording = useCallback(() => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    startRecording();
  }, [session, startRecording, setShowAuthModal]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setErrorMsg('');
    if (!transcript || transcript.trim().length === 0) {
      setErrorMsg("No speech detected. Please ensure your microphone is enabled and try speaking again!");
      return;
    }
    processTranscript(transcript);
  }, [stopRecording, transcript, processTranscript]);

  const handleManualSubmit = useCallback(() => {
    setErrorMsg('');
    if (!transcript || transcript.trim().length === 0) {
      setErrorMsg("Please type or paste something before formatting!");
      return;
    }
    processTranscript(transcript);
  }, [transcript, processTranscript]);

  // Restore a full session from history (setDisplayText is declared above)
  const handleLoadSession = useCallback((entry) => {
    setTranscript(entry.transcript || '');
    setDisplayText(entry.transcript || '');
    setFormattedData({
      summary: entry.summary,
      detailed: entry.detailed,
      bullets: entry.bullets,
      questions: entry.questions,
      visuals: entry.visuals,
    });
    setShowHistory(false);
    showRestoredToast();
  }, [setTranscript, showRestoredToast]);

  // displayText state is declared above near other state vars
  useEffect(() => {
    if (isRecording) {
      if (transcript !== displayText) {
        const diff = transcript.length - displayText.length;
        if (diff > 0) {
          const jumpSize = diff > 20 ? 3 : 1;
          const timeout = setTimeout(() => {
            setDisplayText(transcript.slice(0, displayText.length + jumpSize));
          }, diff > 30 ? 5 : 10);
          return () => clearTimeout(timeout);
        } else {
          setDisplayText(transcript);
        }
      }
    } else {
      setDisplayText(transcript);
    }
  }, [transcript, displayText, isRecording]);

  const handleClearAll = useCallback(() => {
    setTranscript('');
    setDisplayText('');
    setFormattedData(null);
  }, [setTranscript]);

  return (
    <>
      {/* Error Toast */}
      {errorMsg && (
        <div className="glass-panel animate-slide-up" style={{ position: 'fixed', top: '100px', right: '40px', zIndex: 1000, background: 'rgba(13, 15, 20, 0.8)', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} style={{ opacity: 0.5 }}>✕</button>
        </div>
      )}

      {/* Restored Session Toast */}
      {restoredToast && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            background: 'rgba(139, 92, 246, 0.15)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            padding: '12px 24px',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
          }}
        >
          <span style={{ fontSize: '1rem' }}>✓</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Session restored successfully
          </span>
        </div>
      )}

      {/* History Panel */}
      <FocusHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onLoadSession={handleLoadSession}
        onDeleteSession={deleteSession}
        onClearAll={clearAll}
      />

      <main className="dashboard-grid page-enter">
        <section className="input-section">
          <div style={{ flex: 1, minHeight: '300px' }}>
            <Recorder
              isRecording={isRecording}
              isProcessing={isProcessing}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              transcript={displayText}
              style={{ height: '100%' }}
            />
          </div>

          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Input Source</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* History Button with badge */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowHistory(true)}
                    style={{ opacity: 0.6, padding: '4px' }}
                    className="hover-lift"
                    title={`View History (${history.length} sessions)`}
                  >
                    <History size={16} />
                  </button>
                  {history.length > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: 'var(--accent-gradient)',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        pointerEvents: 'none',
                      }}
                    >
                      {history.length > 9 ? '9+' : history.length}
                    </span>
                  )}
                </div>

                {/* Clear button */}
                <button
                  onClick={handleClearAll}
                  style={{ opacity: 0.4, padding: '4px' }}
                  className="hover-lift"
                  title="Clear Everything"
                >
                  <Eraser size={16} />
                </button>
              </div>
            </div>

            {/* Model Selector moved to header */}

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                value={displayText}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setDisplayText(e.target.value);
                }}
                placeholder="Type or paste to format, or start voice session above..."
                className="input-glass"
                style={{
                  width: '100%', flex: 1,
                  borderRadius: '16px', padding: '16px', color: 'var(--text-primary)',
                  fontSize: '1rem', resize: 'none', border: '1px solid var(--surface-border)',
                  background: 'rgba(0,0,0,0.1)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleManualSubmit}
                disabled={isProcessing || !transcript.trim()}
                className="gradient-bg-animated hover-lift tap-effect"
                style={{
                  flex: 1, padding: '16px', borderRadius: '14px',
                  color: 'white', fontWeight: 800, fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  opacity: (transcript.trim() && !isProcessing) ? 1 : 0.4,
                  pointerEvents: (transcript.trim() && !isProcessing) ? 'auto' : 'none'
                }}
              >
                {isProcessing ? <RefreshCw size={20} className="animate-spin" /> : <SendHorizontal size={20} />}
                {isProcessing
                  ? `${(availableProviders.find(p => p.id === selectedProvider)?.models?.find(m => m.id === selectedModel)?.name) || 'AI'} thinking...`
                  : 'Analyze Source'}
              </button>
            </div>
          </div>
        </section>

        <section className="output-section">
          <div className="output-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: 'auto', minHeight: '100%' }}>
            <ResultsDisplay
              isDark={isDark}
              isProcessing={isProcessing}
              summary={formattedData?.summary}
              detailed={formattedData?.detailed}
              bullets={formattedData?.bullets}
              questions={formattedData?.questions}
              infographicsCode={formattedData?.visuals}
            />

            {formattedData && !isProcessing && (
              <ExportBar
                summary={formattedData.summary}
                bullets={formattedData.bullets}
                questions={formattedData.questions}
              />
            )}

            {!formattedData && !isProcessing && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, textAlign: 'center', padding: '100px 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✨</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Ready to assist</h2>
                <p style={{ maxWidth: '300px' }}>Your formatted insights will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default FocusMode;
