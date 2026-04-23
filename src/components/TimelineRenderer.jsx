import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Calendar, CheckCircle2, ChevronDown,
  Rocket, LayoutList, Columns, ArrowRight, Activity,
  Play, Pause, SkipForward, SkipBack, XCircle, Sparkles
} from 'lucide-react';

const categoryIcons = {
  milestone: <Rocket size={20} />,
  task: <CheckCircle2 size={20} />,
  event: <Calendar size={20} />,
  default: <Clock size={20} />
};

const categoryColors = {
  milestone: '#8b5cf6', // Violet
  task: '#10b981',      // Emerald
  event: '#06b6d4',     // Cyan
  default: '#64748b'    // Slate
};

const TimelineItem = ({ event, index, isLast, layout, isActive, onToggleExpand, isDark = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = categoryColors[event.category] || categoryColors.default;
  const icon = categoryIcons[event.category] || categoryIcons.default;
  const itemRef = useRef(null);

  // Auto-expand and scroll if active in presentation mode
  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
      itemRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [isActive]);

  const toggle = () => {
    setIsExpanded(!isExpanded);
    if (onToggleExpand) onToggleExpand();
  };

  const activeStyles = isActive ? {
    borderColor: isDark ? 'white' : color,
    boxShadow: isDark ? `0 0 40px ${color}66` : `0 10px 30px ${color}22`,
    transform: layout === 'horizontal' ? 'scale(1.05) translateY(-10px)' : 'scale(1.02) translateX(10px)',
    background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
    zIndex: 50
  } : {};

  if (layout === 'horizontal') {
    return (
      <div className="timeline-item-h" ref={itemRef} style={{ transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '24px' }}>
          <div className={`timeline-track-h ${isDark ? '' : 'light'}`} style={{ visibility: index === 0 ? 'hidden' : 'visible', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
          <div
            className={`timeline-dot ${isActive ? 'active-pulse' : ''}`}
            style={{
              borderColor: isActive ? (isDark ? 'white' : color) : color,
              boxShadow: isActive ? `0 0 30px ${color}` : `0 0 20px ${color}33`,
              transform: isActive ? 'scale(1.3)' : 'scale(1)',
              background: isDark ? 'var(--bg-color)' : '#ffffff'
            }}
            onClick={toggle}
          >
            <div style={{ color: isActive ? (isDark ? 'white' : color) : color }}>{icon}</div>
          </div>
          <div className={`timeline-track-h ${isDark ? '' : 'light'}`} style={{ visibility: isLast ? 'hidden' : 'visible', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
        </div>

        <div
          onClick={toggle}
          className={`timeline-card ${isExpanded ? 'expanded' : ''} ${isDark ? '' : 'light'}`}
          style={{
            width: '100%',
            ...activeStyles,
            background: isActive ? (isDark ? 'rgba(255,255,255,0.08)' : '#ffffff') : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
            border: `1px solid ${isActive ? (isDark ? 'white' : color) : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')}`
          }}
        >
          {isActive && (
            <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--accent-gradient)', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '4px 8px', borderRadius: '100px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              NOW VIEWING
            </div>
          )}
          <div style={{ marginBottom: '12px' }}>
            <span className="timeline-viz-pill" style={{ background: isActive ? (isDark ? 'white' : color) : `${color}15`, color: isActive ? (isDark ? 'black' : 'white') : color, marginBottom: '10px' }}>
              {event.time}
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isDark ? 'white' : '#1e293b', lineHeight: 1.3 }}>{event.title}</h3>
          </div>

          <div style={{
            maxHeight: isExpanded ? '200px' : '0',
            overflow: 'hidden',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: isExpanded ? 1 : 0
          }}>
            <p style={{ color: isDark ? 'var(--text-secondary)' : '#64748b', fontSize: '0.85rem', paddingTop: '16px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`, marginTop: '8px', lineHeight: 1.6 }}>
              {event.description}
            </p>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: isActive ? (isDark ? 'white' : color) : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'), textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {event.category || 'POINT'}
            </span>
            <div style={{ 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-item-v" ref={itemRef} style={{ transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div
          className={`timeline-dot ${isActive ? 'active-pulse' : ''}`}
          style={{
            borderColor: isActive ? (isDark ? 'white' : color) : color,
            boxShadow: isActive ? `0 0 30px ${color}` : `0 0 20px ${color}33`,
            transform: isActive ? 'scale(1.3)' : 'scale(1)',
            background: isDark ? 'var(--bg-color)' : '#ffffff'
          }}
          onClick={toggle}
        >
          <div style={{ color: isActive ? (isDark ? 'white' : color) : color }}>{icon}</div>
        </div>
        {!isLast && <div className="timeline-track-v" style={{ background: `linear-gradient(to bottom, ${isActive ? (isDark ? 'white' : color) : color}, transparent)`, opacity: isDark ? 1 : 0.3 }} />}
      </div>

      <div style={{ flex: 1, paddingBottom: '48px' }}>
        <div
          onClick={toggle}
          className={`timeline-card ${isExpanded ? 'expanded' : ''} ${isDark ? '' : 'light'}`}
          style={{
            ...activeStyles,
            background: isActive ? (isDark ? 'rgba(255,255,255,0.08)' : '#ffffff') : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
            border: `1px solid ${isActive ? (isDark ? 'white' : color) : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')}`,
            boxShadow: isActive ? (isDark ? `0 0 40px ${color}66` : `0 10px 30px ${color}15`) : (isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.02)')
          }}
        >
          {isActive && (
            <div style={{ position: 'absolute', top: '15px', right: '50px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ background: '#8b5cf6' }}></span>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8b5cf6', letterSpacing: '0.1em' }}>ACTIVE TRACKING</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
            <div>
              <span className="timeline-viz-pill" style={{ background: isActive ? (isDark ? 'white' : color) : `${color}15`, color: isActive ? (isDark ? 'black' : 'white') : color, marginBottom: '10px' }}>
                {event.time}
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: isDark ? 'white' : '#1e293b', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{event.title}</h3>
            </div>
            <div style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
            }}>
              <ChevronDown size={20} />
            </div>
          </div>

          <div style={{
            maxHeight: isExpanded ? '500px' : '0',
            overflow: 'hidden',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: isExpanded ? 1 : 0
          }}>
            <p style={{ color: isDark ? 'var(--text-secondary)' : '#64748b', fontSize: '1rem', lineHeight: 1.7, paddingTop: '20px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`, marginTop: '20px' }}>
              {event.description}
            </p>
            {event.category && (
              <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: color, fontWeight: 900, textTransform: 'uppercase', background: `${color}10`, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${color}20` }}>
                  {event.category}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineRenderer = ({ events, isDark = true }) => {
  const [layout, setLayout] = useState('vertical');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(3000); // 3 seconds per item

  // Playback timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      if (currentIndex === -1) setCurrentIndex(0);

      timer = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev < events.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, events.length, playbackSpeed]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const resetPlayback = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
  };
  const nextItem = () => setCurrentIndex(prev => Math.min(prev + 1, events.length - 1));
  const prevItem = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  if (!events || events.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '100px 40px', background: isDark ? 'rgba(13, 15, 20, 0.4)' : 'rgba(248, 250, 252, 0.8)',
        borderRadius: '40px', border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}>
        <div style={{ padding: '20px', borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', marginBottom: '20px' }}>
          <Activity size={40} color={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
        </div>
        <p style={{ color: isDark ? 'var(--text-secondary)' : '#64748b', fontWeight: 600, fontSize: '1.1rem' }}>Listening for chronological events...</p>
      </div>
    );
  }

  return (
    <div className={`timeline-viz-card ${isPlaying ? 'presentation-mode' : ''} ${isDark ? '' : 'light'}`} style={{ padding: '60px 40px 40px 40px' }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 30 }}>
        <header className="timeline-viz-header" style={{ marginBottom: '60px', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div className={`timeline-viz-pill ${isDark ? '' : 'light'}`} style={{ marginBottom: '16px', background: isDark ? '' : 'rgba(0,0,0,0.05)', color: isDark ? '' : '#475569' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPlaying ? '#8b5cf6' : '#10b981', display: 'inline-block', boxShadow: isPlaying ? '0 0 10px #8b5cf6' : '0 0 10px #10b981' }} />
              {isPlaying ? 'SEQUENCE PLAYBACK ACTIVE' : 'CHRONOLOGICAL FLOW'}
            </div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 950, color: isDark ? 'white' : '#1e293b', letterSpacing: '-0.05em', margin: 0, lineHeight: 1.1 }}>
              {isPlaying ? 'Storytelling Mode' : 'Activity Timeline'}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', zIndex: 40 }}>
            {/* Playback Controls */}
            <div style={{
              display: 'flex',
              background: isDark ? 'rgba(0,0,0,0.4)' : '#ffffff',
              padding: '6px',
              borderRadius: '20px',
              border: `1px solid ${isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.1)'}`,
              gap: '4px',
              backdropFilter: 'blur(10px)',
              boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <button
                onClick={prevItem}
                disabled={currentIndex <= 0}
                className={`layout-btn ${isDark ? '' : 'light'}`} style={{ padding: '8px', opacity: currentIndex <= 0 ? 0.3 : 1, color: isDark ? 'white' : '#1e293b' }}
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlay}
                className="layout-btn"
                style={{
                  background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent-gradient)',
                  color: isPlaying ? (isDark ? '#ef4444' : '#dc2626') : 'white',
                  minWidth: '44px',
                  justifyContent: 'center'
                }}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                onClick={nextItem}
                disabled={currentIndex >= events.length - 1}
                className={`layout-btn ${isDark ? '' : 'light'}`} style={{ padding: '8px', opacity: currentIndex >= events.length - 1 ? 0.3 : 1, color: isDark ? 'white' : '#1e293b' }}
              >
                <SkipForward size={18} />
              </button>

              {isPlaying || currentIndex !== -1 ? (
                <button
                  onClick={resetPlayback}
                  className="layout-btn" style={{ padding: '8px', color: '#ef4444' }}
                >
                  <XCircle size={18} />
                </button>
              ) : (
                <button
                  onClick={() => setIsPlaying(true)}
                  className={`layout-btn ${isDark ? '' : 'light'}`}
                  style={{ gap: '10px', color: isDark ? 'white' : '#1e293b' }}
                >
                  <Sparkles size={16} />
                  <span>Present</span>
                </button>
              )}
            </div>

            <div className={`layout-toggle ${isDark ? '' : 'light'}`} style={{ background: isDark ? '' : '#ffffff', border: isDark ? '' : '1px solid rgba(0,0,0,0.1)', boxShadow: isDark ? '' : '0 4px 12px rgba(0,0,0,0.05)' }}>
              <button
                onClick={() => setLayout('vertical')}
                className={`layout-btn ${layout === 'vertical' ? 'active' : ''} ${isDark ? '' : 'light'}`}
                style={{ color: layout === 'vertical' ? 'white' : (isDark ? 'var(--text-secondary)' : '#64748b') }}
              >
                <LayoutList size={16} />
                <span>Vertical</span>
              </button>
              <button
                onClick={() => setLayout('horizontal')}
                className={`layout-btn ${layout === 'horizontal' ? 'active' : ''} ${isDark ? '' : 'light'}`}
                style={{ color: layout === 'horizontal' ? 'white' : (isDark ? 'var(--text-secondary)' : '#64748b') }}
              >
                <Columns size={16} />
                <span>Horizontal</span>
              </button>
            </div>
          </div>
        </header>

        {isPlaying && (
          <div className="animate-slide-up" style={{
            marginBottom: '40px',
            background: isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)',
            border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'}`,
            borderRadius: '20px', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ position: 'relative', width: '200px', height: '6px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--accent-gradient)',
                  width: `${((currentIndex + 1) / events.length) * 100}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#8b5cf6' }}>
                EVENT {currentIndex + 1} OF {events.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[2000, 3000, 5000].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  style={{
                    padding: '4px 10px', fontSize: '0.65rem', fontWeight: 900, borderRadius: '6px',
                    background: playbackSpeed === speed ? 'var(--accent-color)' : (isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                    color: playbackSpeed === speed ? 'white' : (isDark ? 'white' : '#64748b'),
                    border: isDark ? 'none' : '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  {speed / 1000}S
                </button>
              ))}
            </div>
          </div>
        )}

        {layout === 'vertical' ? (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            {events.map((event, index) => (
              <TimelineItem
                key={event.id || index}
                event={event}
                index={index}
                isLast={index === events.length - 1}
                layout="vertical"
                isActive={currentIndex === index}
                onToggleExpand={() => isPlaying && setIsPlaying(false)}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div className="horizontal-scroll-container">
              {events.map((event, index) => (
                <TimelineItem
                  key={event.id || index}
                  event={event}
                  index={index}
                  isLast={index === events.length - 1}
                  layout="horizontal"
                  isActive={currentIndex === index}
                  onToggleExpand={() => isPlaying && setIsPlaying(false)}
                  isDark={isDark}
                />
              ))}
            </div>

            {/* Scroll indicators */}
            <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '120px', height: '100%', background: `linear-gradient(to left, ${isDark ? 'var(--bg-color)' : '#f8fafc'}, transparent)`, pointerEvents: 'none', opacity: 0.9 }} />

            {!isPlaying && (
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', color: isDark ? 'var(--text-secondary)' : '#64748b', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em' }}>
                <ArrowRight size={16} className="animate-bounce-x" />
                DRAG OR SCROLL TO EXPLORE
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineRenderer;
