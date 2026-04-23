import React, { useState, useEffect, useRef, memo } from 'react';
import { Mic, Square } from 'lucide-react';

const Recorder = memo(({ isRecording, isProcessing, onStart, onStop, transcript, style = {}, isDark = true }) => {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      startVisualization();
    } else {
      stopVisualization();
      setVolume(0);
    }
    return () => stopVisualization();
  }, [isRecording]);

  const startVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      analyzerRef.current.fftSize = 64;
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        analyzerRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((p, c) => p + c, 0) / bufferLength;
        setVolume(average);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error('Audio Visualization failed', err);
    }
  };

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex', flexDirection: 'column', padding: '24px',
        position: 'relative', border: isRecording ? '1px solid var(--accent-color)' : (isDark ? undefined : '1px solid rgba(0,0,0,0.05)'),
        height: '100%',
        background: isDark ? 'var(--surface-color)' : 'rgba(255,255,255,0.8)',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {isRecording ? 'Capturing Speech' : 'Voice Interaction'}
        </h3>
        {isRecording && <div className="status-pill status-live" style={{ background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>Live</div>}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div
          className={`organic-orb-container ${isRecording ? 'recording' : ''}`}
          style={{
            cursor: 'pointer',
            transform: `scale(${1 + (volume / 400)})`,
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: isDark ? 'url("#gooey-effect")' : 'url("#gooey-effect") brightness(1.1)',
            boxShadow: isDark ? '0 0 100px rgba(139, 92, 246, 0.2)' : '0 20px 60px rgba(139, 92, 246, 0.1)'
          }}
          onClick={isRecording ? onStop : onStart}
        >
          {/* Multi-blob Liquid System */}
          <div className="organic-orb-blob blob-1" style={{ 
            transform: `scale(${1 + (volume / 100)}) rotate(${volume * 2}deg)`,
            opacity: isDark ? 0.98 : 0.8
          }} />
          <div className="organic-orb-blob blob-2" style={{ 
            transform: `scale(${1 + (volume / 150)}) rotate(${-volume * 1.5}deg)`,
            opacity: isDark ? 0.98 : 0.8
          }} />
          <div className="organic-orb-blob blob-3" style={{ 
            transform: `scale(${1 + (volume / 120)}) rotate(${volume}deg)`,
            opacity: isDark ? 0.98 : 0.7
          }} />

          <div className="organic-orb-glint" style={{ opacity: isDark ? 0.5 : 0.8 }} />
          <div className="organic-orb-core" style={{ transform: `scale(${0.8 + (volume / 100)})`, opacity: isDark ? 0.7 : 0.9 }} />

          {isRecording ? (
            <Square size={32} color="white" style={{ position: 'relative', zIndex: 10, filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }} />
          ) : (
            <Mic size={32} color="white" style={{ position: 'relative', zIndex: 10, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
          )}
        </div>
      </div>

      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="gooey-effect">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {!isRecording && !isProcessing && (
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.6 }}>Tap the Liquid Mass to Start</p>
        </div>
      )}
    </div>
  );
});

export default Recorder;
