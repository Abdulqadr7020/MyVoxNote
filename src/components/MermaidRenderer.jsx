import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { toPng } from 'html-to-image';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  themeVariables: {
    primaryColor: '#8b5cf6',
    primaryTextColor: '#fff',
    primaryBorderColor: '#8b5cf6',
    lineColor: '#06b6d4',
    secondaryColor: '#06b6d4',
    tertiaryColor: '#1e293b'
  }
});

const MermaidRenderer = ({ chart, isDark = true }) => {
  const containerRef = useRef(null);
  const exportRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [id, setId] = useState('mermaid-ssr-id');
  
  useEffect(() => {
    setId(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      themeVariables: {
        primaryColor: '#8b5cf6',
        primaryTextColor: isDark ? '#fff' : '#1e293b',
        primaryBorderColor: '#8b5cf6',
        lineColor: isDark ? '#06b6d4' : '#0891b2',
        secondaryColor: isDark ? '#06b6d4' : '#0891b2',
        tertiaryColor: isDark ? '#1e293b' : '#f8fafc'
      }
    });

    if (!chart) return;
    
    const cleanChart = chart.replace(/\\n/g, '\n').trim();

    const renderChart = async () => {
      try {
        setError(false);
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        setSvg(renderedSvg);
      } catch (e) {
        console.error("Mermaid Render Error", e);
        setError(true);
      }
    };
    
    renderChart();
  }, [chart, id, isDark]);

  const handleExport = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, { backgroundColor: isDark ? '#0d0f14' : '#ffffff' });
      const link = document.createElement('a');
      link.download = `voxnote-visual-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  if (error) {
    return <div style={{color:'var(--danger)', padding:'12px', background:'rgba(239, 68, 68, 0.1)', borderRadius:'8px'}}>Failed to render visualization. Try another mode or check your transcript.</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Controls */}
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 100, display: 'flex', gap: '8px', padding: '10px' }}>
        <button onClick={handleExport} className="magic-reveal-btn" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-secondary)' }} title="Export PNG">
          <Download size={16} />
        </button>
      </div>

      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        centerOnInit={true}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 100, display: 'flex', gap: '8px' }}>
              <button onClick={() => zoomIn()} className="magic-reveal-btn" style={{ width: '36px', height: '36px', padding: 0, justifyContent: 'center' }}>
                <ZoomIn size={18} />
              </button>
              <button onClick={() => zoomOut()} className="magic-reveal-btn" style={{ width: '36px', height: '36px', padding: 0, justifyContent: 'center' }}>
                <ZoomOut size={18} />
              </button>
              <button onClick={() => resetTransform()} className="magic-reveal-btn" style={{ width: '36px', height: '36px', padding: 0, justifyContent: 'center' }}>
                <RotateCcw size={18} />
              </button>
            </div>
            
            <div ref={exportRef} style={{ background: isDark ? '#0d0f14' : '#ffffff', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.05)'}`, flex: 1 }}>
              <TransformComponent wrapperStyle={{ width: '100%', height: '400px' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div 
                  ref={containerRef} 
                  className="mermaid-wrapper" 
                  style={{ padding: '40px', cursor: 'grab' }}
                  dangerouslySetInnerHTML={{ __html: svg }} 
                />
              </TransformComponent>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default MermaidRenderer;
