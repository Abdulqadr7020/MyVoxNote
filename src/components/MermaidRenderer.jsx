import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { toPng } from 'html-to-image';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

if (typeof window !== 'undefined' && window.trustedTypes && window.trustedTypes.createPolicy) {
  try {
    window.trustedTypes.createPolicy('default', {
      createHTML: (string) => string,
      createScriptURL: (string) => string,
      createScript: (string) => string,
    });
  } catch (e) {
    // Policy may already exist
  }
}


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

const MermaidRenderer = ({ chart }) => {
  const containerRef = useRef(null);
  const exportRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [id, setId] = useState('mermaid-ssr-id');
  
  useEffect(() => {
    setId(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  useEffect(() => {
    if (!chart) return;
    
    const cleanChart = chart.replace(/\\n/g, '\n').trim();

    const renderChart = async () => {
      try {
        setError(false);
        const { svg } = await mermaid.render(id, cleanChart);
        setSvg(svg);
      } catch (e) {
        console.error("Mermaid Render Error", e);
        setError(true);
      }
    };
    
    renderChart();
  }, [chart, id]);

  const handleExport = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, { backgroundColor: '#0d0f14' });
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
            
            <div ref={exportRef} style={{ background: '#0d0f14', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--surface-border)', flex: 1 }}>
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
