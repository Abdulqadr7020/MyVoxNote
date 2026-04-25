import React, { useState, useEffect, Suspense, memo, lazy } from 'react';
import {
  FileText, Zap, Clock, ChevronDown, ChevronRight,
  Lightbulb, CheckCircle2, Layout, GitBranch,
  HelpCircle, Share2, Table as TableIcon, BookOpen
} from 'lucide-react';

const MermaidRenderer = lazy(() => import('./MermaidRenderer'));
const FlowRenderer = lazy(() => import('./FlowRenderer'));
const MindMapRenderer = lazy(() => import('./MindMapRenderer'));
const TimelineRenderer = lazy(() => import('./TimelineRenderer'));
const TableRenderer = lazy(() => import('./TableRenderer'));

const ResultsDisplay = memo(({ isDark, isProcessing, summary, detailed, bullets, questions, infographicsCode }) => {
  const [activeTab, setActiveTab] = useState('bullets');
  const [slideDirection, setSlideDirection] = useState('right');
  const [expandedBullets, setExpandedBullets] = useState(new Set());
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  const [visualMode, setVisualMode] = useState('flowchart');
  const [isDetailed, setIsDetailed] = useState(false);

  const tabs = [
    { id: 'bullets', icon: <FileText size={18} />, label: 'Key Points' },
    { id: 'questions', icon: <HelpCircle size={18} />, label: 'Q&A' },
    { id: 'visuals', icon: <Share2 size={18} />, label: 'Visuals' },
  ];

  useEffect(() => {
    if (!isProcessing && summary && activeTab === 'raw') {
      setActiveTab('bullets');
    }
  }, [summary, isProcessing, activeTab]);

  const handleTabClick = (tabId) => {
    if (tabId === activeTab) return;
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    const nextIndex = tabs.findIndex(t => t.id === tabId);
    setSlideDirection(nextIndex > currentIndex ? 'right' : 'left');
    setActiveTab(tabId);
  };

  const toggleBullet = (index) => {
    const newSet = new Set(expandedBullets);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setExpandedBullets(newSet);
  };

  const toggleAnswer = (index) => {
    const newSet = new Set(revealedAnswers);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setRevealedAnswers(newSet);
  };

  const renderFormattedContent = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text.split(/(\[HEADING\].*?|\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('[HEADING]')) {
        return <div key={i} className="magic-heading" style={{ marginTop: i === 0 ? 0 : '16px' }}>{part.replace('[HEADING]', '').trim()}</div>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="magic-highlight">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  const formatText = (text, isDetailedView = false) => {
    if (!text) return null;
    return (
      <div
        className={`summary-card ${isDetailedView ? 'detailed-view' : ''}`}
        style={{
          background: isDark 
            ? (isDetailedView ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)')
            : (isDetailedView ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)'),
          border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          color: isDark ? 'inherit' : '#334155'
        }}
      >
        {renderFormattedContent(text)}
      </div>
    );
  };

  const renderVisualTab = () => {
    const visualData = (typeof infographicsCode === 'object' && infographicsCode !== null) ? infographicsCode : null;
    const oldCode = typeof infographicsCode === 'string' ? infographicsCode : null;

    if (!visualData && !oldCode) return (
      <div className={`flex flex-col items-center justify-center p-20 rounded-3xl border border-dashed ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`p-4 rounded-full mb-4 animate-pulse ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
          <Share2 className={`${isDark ? 'text-slate-600' : 'text-slate-400'} w-8 h-8`} />
        </div>
        <p className={`${isDark ? 'text-slate-500' : 'text-slate-400'} font-medium tracking-tight`}>Listening for visual concepts...</p>
      </div>
    );

    if (visualMode === 'table' && visualData?.table) {
      return (
        <div className="animate-premium-slide" style={{ width: '100%' }}>
          <TableRenderer isDark={isDark} data={visualData.table} />
        </div>
      );
    }

    if (visualMode === 'flowchart' && visualData?.graphData) {
      return (
        <div className="animate-premium-slide" style={{ width: '100%', minHeight: '520px' }}>
          <FlowRenderer isDark={isDark} data={visualData.graphData} />
        </div>
      );
    }

    if (visualMode === 'mindmap' && visualData?.mindMapData) {
      return (
        <div className="animate-premium-slide" style={{ width: '100%', minHeight: '520px' }}>
          <MindMapRenderer isDark={isDark} treeData={visualData.mindMapData} />
        </div>
      );
    }

    if (visualMode === 'timeline' && visualData?.timelineData) {
      return (
        <div className="animate-premium-slide" style={{ width: '100%', minHeight: '520px' }}>
          <TimelineRenderer isDark={isDark} events={visualData.timelineData} />
        </div>
      );
    }

    const currentChart = visualData ? visualData[visualMode] : oldCode;
    return (
      <div style={{ 
        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)', 
        borderRadius: '24px', 
        padding: '24px', 
        minHeight: '400px',
        border: isDark ? 'none' : '1px solid rgba(0,0,0,0.05)',
        boxShadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.03)'
      }}>
        <MermaidRenderer isDark={isDark} chart={currentChart || (oldCode && visualMode === 'flowchart' ? oldCode : null)} />
      </div>
    );
  };

  if (isProcessing) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '60px 40px', flex: 1 }}>
        <div className="ai-orb">✨</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--accent-secondary)', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.02em' }}>ANALYZING TRANSCRIPT</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div className="thinking-dot" />
              <div className="thinking-dot" />
              <div className="thinking-dot" />
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center', maxWidth: '350px', lineHeight: 1.6 }}>
            Our AI is distilling your speech into structured insights, key takeaways, and visual representations.
          </p>
        </div>
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="skeleton-line" style={{ width: '100%' }} />
          <div className="skeleton-line" style={{ width: '85%' }} />
          <div className="skeleton-line" style={{ width: '92%' }} />
          <div className="skeleton-line" style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  if (!summary && !bullets && !questions) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
      <section className="animate-premium-slide" style={{ animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDetailed ? <BookOpen size={20} color="var(--accent-secondary)" /> : <Zap size={20} color="var(--accent-color)" />}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{isDetailed ? 'Detailed Analysis' : 'Executive Summary'}</h2>
          </div>

          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px',
            borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={() => setIsDetailed(false)}
              style={{
                padding: '6px 12px', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 700,
                background: !isDetailed ? 'var(--accent-gradient)' : 'transparent',
                color: !isDetailed ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s ease'
              }}
            >
              Summary
            </button>
            <button
              onClick={() => setIsDetailed(true)}
              style={{
                padding: '6px 12px', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 700,
                background: isDetailed ? 'var(--accent-gradient)' : 'transparent',
                color: isDetailed ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s ease'
              }}
            >
              Detailed
            </button>
          </div>
        </div>
        <div className="scroll-roll" style={{ maxHeight: isDetailed ? '400px' : 'none', overflowY: isDetailed ? 'auto' : 'visible' }}>
          {isDetailed ? formatText(detailed || "No detailed analysis available for this transcript.", true) : formatText(summary)}
        </div>
      </section>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '500px', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--surface-border)', padding: '12px', gap: '8px',
          background: 'rgba(0,0,0,0.2)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'tab-active' : ''}`}
              style={{
                padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                background: activeTab === tab.id ? 'var(--accent-gradient)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          <div key={activeTab} className={slideDirection === 'right' ? 'slide-right' : 'slide-left'}>
            {activeTab === 'bullets' && (
              <div className="result-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '12px', contentVisibility: 'auto' }}>
                {bullets?.map((b, i) => (
                  <div key={i} className="collapsible-item stagger-item hover-lift" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="collapsible-header" onClick={() => toggleBullet(i)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 }}>
                        <CheckCircle2 size={18} color="var(--accent-secondary)" />
                        {renderFormattedContent(typeof b === 'object' ? b.title : b)}
                      </div>
                      {expandedBullets.has(i) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                    {expandedBullets.has(i) && typeof b === 'object' && b.details && (
                      <div className="collapsible-content" style={{ padding: '16px', background: 'rgba(0,0,0,0.1)', marginTop: '4px', borderRadius: '0 0 12px 12px' }}>
                        {b.details.map((detail, di) => (
                          <div key={di} className="collapsible-detail" style={{ padding: '4px 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>• {renderFormattedContent(detail)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="flashcard-container result-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '16px', contentVisibility: 'auto' }}>
                {questions?.map((q, i) => (
                  <div key={i} className="flashcard stagger-item hover-lift" onClick={() => toggleAnswer(i)} style={{ animationDelay: `${i * 0.1}s`, cursor: 'pointer', padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flashcard-question" style={{ display: 'flex', gap: '12px', fontSize: '1rem', fontWeight: 600 }}>
                      <Lightbulb size={20} color="var(--accent-color)" style={{ flexShrink: 0 }} />
                      {renderFormattedContent(typeof q === 'object' ? q.question : q)}
                    </div>
                    {!revealedAnswers.has(i) && (
                      <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <button className="magic-reveal-btn" style={{ background: 'var(--accent-gradient)', border: 'none', padding: '8px 16px', borderRadius: '8px', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>REVEAL ANSWER</button>
                      </div>
                    )}
                    {revealedAnswers.has(i) && (
                      <div className="flashcard-answer" style={{ marginTop: '16px', padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', borderLeft: '4px solid var(--accent-color)' }}>
                        {renderFormattedContent(typeof q === 'object' ? q.answer : "No answer provided.")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'visuals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '16px', alignSelf: 'flex-start' }}>
                  {[
                    { id: 'flowchart', label: 'Flow', icon: <Layout size={14} /> },
                    { id: 'mindmap', label: 'Mind Map', icon: <GitBranch size={14} /> },
                    { id: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
                    { id: 'table', label: 'Table', icon: <TableIcon size={14} /> }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setVisualMode(m.id)}
                      style={{
                        background: visualMode === m.id ? 'var(--accent-gradient)' : 'transparent',
                        color: visualMode === m.id ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                <Suspense fallback={
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: '400px', background: 'rgba(0,0,0,0.1)', borderRadius: '24px'
                  }}>
                    <div className="ai-orb" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>✨</div>
                  </div>
                }>
                  {renderVisualTab()}
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ResultsDisplay;
