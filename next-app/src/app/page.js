"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Mic, Sun, Moon, RefreshCw, SendHorizontal, Eraser } from 'lucide-react';
import Recorder from '../components/Recorder';
import ResultsDisplay from '../components/ResultsDisplay';
import ExportBar from '../components/ExportBar';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { formatSpeechWithAI } from '../services/ai';
import { signIn, signOut, useSession } from "next-auth/react";

const MODES = [
  { id: 'default', icon: '✨', label: 'Standard', title: 'Balanced summary, key points, and study questions.' },
  { id: 'exam', icon: '📚', label: 'Exam Mode', title: 'Deep analysis with technical terms, 8-10 exam questions, and thorough explanations.' },
  { id: 'quickRevision', icon: '⚡', label: 'Quick Revision', title: 'Hyper-concise notes, only 3-4 bullet points, and critical essentials.' }
];

export default function Home() {
  const { data: session } = useSession();
  const { isRecording, transcript, isSupported, error: recognitionError, startRecording, stopRecording, setTranscript } = useSpeechRecognition();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [formattedData, setFormattedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [processingMode, setProcessingMode] = useState('default');

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

  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('voxnote-theme');
    const dark = saved !== 'light';
    setIsDark(dark);
    document.body.classList.toggle('light-mode', !dark);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.body.classList.toggle('light-mode', !next);
    localStorage.setItem('voxnote-theme', next ? 'dark' : 'light');
  }, [isDark]);

  const processTranscript = useCallback(async (textToProcess) => {
    setIsProcessing(true);
    try {
      const result = await formatSpeechWithAI(textToProcess, processingMode);
      setFormattedData(result);
    } catch (e) {
      setErrorMsg(e.message || "Failed to format speech.");
    } finally {
      setIsProcessing(false);
    }
  }, [processingMode]);

  const handleStartRecording = useCallback(() => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    startRecording();
  }, [session, startRecording]);

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
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    setErrorMsg('');
    if (!transcript || transcript.trim().length === 0) {
      setErrorMsg("Please type or paste something before formatting!");
      return;
    }
    processTranscript(transcript);
  }, [session, transcript, processTranscript]);

  const [displayText, setDisplayText] = useState('');
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

  return (
    <>
      <header className="animate-slide-up" style={{
        padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 100, background: 'transparent', border: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <img src="/logo.png" alt="VoxNote Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <h1 className="gradient-text" style={{ fontSize: '1.7rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em' }}>VoxNote</h1>
        </div>

        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center', flex: 1, justifyContent: 'center' }} className="hide-mobile">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => {
                setProcessingMode(m.id);
                if (transcript && transcript.trim().length > 0) {
                  setIsProcessing(true);
                  formatSpeechWithAI(transcript, m.id)
                    .then(result => setFormattedData(result))
                    .catch(e => setErrorMsg(e.message))
                    .finally(() => setIsProcessing(false));
                }
              }}
              style={{
                position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
                color: processingMode === m.id ? 'white' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                fontWeight: 600, fontSize: '0.85rem'
              }}
            >
              <span style={{ fontSize: '1.2rem', filter: processingMode === m.id ? 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.6))' : 'grayscale(100%) opacity(0.5)' }}>
                {m.icon}
              </span>
              <span style={{ letterSpacing: '0.02em' }}>{m.label}</span>
              {processingMode === m.id && (
                <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '2px', background: 'var(--accent-gradient)', borderRadius: '2px', boxShadow: '0 0 10px var(--accent-color)' }} />
              )}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <button onClick={toggleTheme} style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.03)', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {session ? (
            <button onClick={() => signOut()} style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '50%', padding: '2px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
              <img src={session.user?.image || ''} alt="Profile" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #0d0f14', objectFit: 'cover' }} />
            </button>
          ) : (
            <button onClick={() => signIn('google')} className="magic-reveal-btn" style={{ padding: '0 24px', height: '42px', borderRadius: '12px', background: 'var(--accent-gradient)', color: 'white', fontWeight: 700, border: 'none' }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <div className="auth-modal-glow" />
            <div style={{ background: 'var(--accent-gradient)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <Mic size={40} color="white" />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>Unlock Your <span className="gradient-text">Intelligence</span></h2>
            <button
              onClick={() => {
                setIsLoggingIn(true);
                setShowAuthModal(false);
                signIn('google');
              }}
              disabled={isLoggingIn}
              className="gradient-bg-animated"
              style={{
                width: '100%', padding: '18px', borderRadius: '16px', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                opacity: isLoggingIn ? 0.7 : 1, pointerEvents: isLoggingIn ? 'none' : 'auto'
              }}
            >
              {isLoggingIn ? <RefreshCw size={20} className="animate-spin" /> : null}
              {isLoggingIn ? 'Connecting...' : 'Get Started with Google'}
            </button>
            <button onClick={() => setShowAuthModal(false)} style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '0.9rem', marginTop: '16px' }}>Maybe Later</button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="glass-panel animate-slide-up" style={{ position: 'fixed', top: '100px', right: '40px', zIndex: 1000, background: 'rgba(13, 15, 20, 0.8)', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} style={{ opacity: 0.5 }}>✕</button>
        </div>
      )}

      <main className="dashboard-grid page-enter">
        <section className="input-section">
          {/* Top Panel: Voice Card */}
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

          {/* Bottom Panel: Input Text Workspace */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Input Source</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setTranscript(''); setDisplayText(''); setFormattedData(null); }}
                  style={{ opacity: 0.4, padding: '4px' }}
                  className="hover-lift"
                  title="Clear Everything"
                >
                  <Eraser size={16} />
                </button>
              </div>
            </div>

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
                {isProcessing ? 'Thinking...' : 'Analyze Source'}
              </button>
            </div>
          </div>
        </section>

        <section className="output-section">
          <div className="output-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px', minHeight: 'min-content' }}>
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
}
