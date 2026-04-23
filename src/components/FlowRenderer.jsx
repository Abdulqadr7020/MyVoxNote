import React, { useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  getNodesBounds,
  getViewportForBounds,
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  Handle,
  Position,
} from '@xyflow/react';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import { Download, Share2, Sparkles, Layout } from 'lucide-react';

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 280;
  const nodeHeight = 100;

  // Set larger separation for a more spacious, premium feel
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 140,
    ranksep: 180,
    marginx: 50,
    marginy: 50
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    }),
    edges,
  };
};

const GlowEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, data }) => {
  const isDark = data?.isDark !== false;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  const baseColor = isDark ? '#06b6d4' : '#0891b2';

  return (
    <>
      {/* Background glow path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: baseColor,
          strokeWidth: isDark ? 6 : 4,
          filter: isDark ? 'blur(10px)' : 'none',
          opacity: isDark ? 0.4 : 0.1
        }}
      />
      {/* Main neon path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: baseColor,
          strokeWidth: 3,
          opacity: 1,
          filter: isDark ? `drop-shadow(0 0 8px ${baseColor})` : 'none'
        }}
      />
      {/* Center highlight path */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: isDark ? '#fff' : 'rgba(255,255,255,0.4)',
          strokeWidth: 1.2,
          opacity: 0.8
        }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: isDark ? '#0d1117' : '#ffffff',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.7rem',
            fontWeight: 900,
            color: isDark ? '#4fd1ed' : '#0891b2',
            border: `2px solid ${isDark ? 'rgba(79, 209, 237, 0.6)' : 'rgba(8, 145, 178, 0.2)'}`,
            boxShadow: isDark ? '0 8px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(6, 182, 212, 0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
            pointerEvents: 'none',
            zIndex: 1000,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const CustomNode = ({ data, selected }) => {
  const isCore = data.type === 'core';
  const isDark = data.isDark !== false;
  const glowColor = isCore ? '#8b5cf6' : '#06b6d4';

  return (
    <div style={{
      borderRadius: '28px',
      background: isDark
        ? (isCore ? 'linear-gradient(145deg, rgba(30, 27, 75, 0.98) 0%, rgba(15, 23, 42, 1) 100%)' : 'rgba(15, 23, 42, 0.9)')
        : (isCore ? 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)' : 'rgba(255, 255, 255, 0.95)'),
      backdropFilter: 'blur(24px)',
      border: `2.5px solid ${selected ? (isDark ? '#fff' : '#8b5cf6') : (isCore ? (isDark ? 'rgba(139, 92, 246, 0.8)' : '#8b5cf6') : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'))}`,
      color: isDark ? 'white' : '#0f172a',
      minWidth: '280px',
      padding: '4px',
      textAlign: 'center',
      boxShadow: selected
        ? `0 0 60px ${glowColor}88`
        : (isDark
          ? (isCore ? '0 0 40px rgba(139, 92, 246, 0.25), 0 20px 60px rgba(0,0,0,0.7)' : '0 15px 50px rgba(0,0,0,0.6)')
          : (isCore ? '0 10px 30px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(0,0,0,0.02)' : '0 4px 12px rgba(0,0,0,0.05)')),
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
      overflow: 'visible'
    }}>
      {/* Connection Handles with Custom Styling */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#06b6d4',
          width: '14px',
          height: '14px',
          border: `3px solid ${isDark ? '#0d0f14' : '#fff'}`,
          top: '-7px',
          boxShadow: '0 0 15px #06b6d4',
          zIndex: 10
        }}
      />

      {/* Shimmer line */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
          animation: 'magic-shimmer 3s infinite linear',
          opacity: 0.8
        }} />
      </div>

      <div style={{ padding: '32px 24px' }}>
        <div style={{
          fontSize: isCore ? '1.25rem' : '1.15rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          marginBottom: '10px',
          color: isDark ? (isCore ? '#fff' : '#f1f5f9') : '#0f172a',
          lineHeight: 1.2
        }}>
          {data.label}
        </div>
        <div style={{
          fontSize: '0.65rem',
          color: isDark ? (isCore ? '#a78bfa' : '#67e8f9') : (isCore ? '#7c3aed' : '#0891b2'),
          textTransform: 'uppercase',
          fontWeight: 900,
          letterSpacing: '0.25em',
          opacity: 0.9
        }}>
          {data.subLabel || (isCore ? 'CENTRAL PILLAR' : 'SUPPORTING CONCEPT')}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#8b5cf6',
          width: '14px',
          height: '14px',
          border: `3px solid ${isDark ? '#0d0f14' : '#fff'}`,
          bottom: '-7px',
          boxShadow: '0 0 15px #8b5cf6',
          zIndex: 10
        }}
      />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };
const edgeTypes = { glow: GlowEdge };

const FlowRenderer = ({ data, isDark = true }) => {
  const reactFlowWrapper = useRef(null);
  const [selectedNodeData, setSelectedNodeData] = React.useState(null);

  const initialElements = useMemo(() => {
    if (!data?.nodes) return { nodes: [], edges: [] };

    // Sort nodes to ensure core is processed in a helpful way if needed
    const nodes = data.nodes.map(n => ({
      id: n.id,
      type: 'custom',
      data: { label: n.label, details: n.details, type: n.type, subLabel: n.subLabel, isDark },
      position: { x: 0, y: 0 }
    }));

    const edges = (data.edges || []).map((e, index) => ({
      id: `e${index}`,
      source: e.source,
      target: e.target,
      label: e.label,
      type: 'glow',
      animated: true,
      data: { isDark }
    }));

    return getLayoutedElements(nodes, edges);
  }, [data, isDark]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);

  React.useEffect(() => {
    setNodes(initialElements.nodes);
    setEdges(initialElements.edges);
  }, [initialElements, setNodes, setEdges]);

  const onNodeClick = useCallback((_, node) => setSelectedNodeData(node.data), []);
  const onPaneClick = useCallback(() => setSelectedNodeData(null), []);

  const onDownload = () => {
    if (!reactFlowWrapper.current) return;
    const nodesBounds = getNodesBounds(nodes);
    const transform = getViewportForBounds(nodesBounds, 2400, 1500, 0.1, 2);

    // Select the viewport for image generation
    const viewport = document.querySelector('.react-flow__viewport');
    if (!viewport) return;

    toPng(viewport, {
      backgroundColor: isDark ? '#0d0f14' : '#f8fafc',
      width: 2400,
      height: 1500,
      style: {
        width: 2400,
        height: 1500,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    }).then((url) => {
      const a = document.createElement('a');
      a.download = `flow-map-${Date.now()}.png`;
      a.href = url;
      a.click();
    });
  };

  return (
    <div ref={reactFlowWrapper} style={{
      width: '100%',
      height: '650px',
      background: isDark ? '#0d0f14' : '#ffffff',
      borderRadius: '32px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)'
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.05}
        maxZoom={1.5}
        zoomOnScroll={false}
        zoomOnPinch={false}
        style={{ width: '100%', height: '100%' }}
      >
        <Background color={isDark ? "#1e293b" : "#cbd5e1"} gap={28} size={1} variant="dots" />

        {selectedNodeData && (
          <Panel position="right" style={{ height: '100%', margin: 0, pointerEvents: 'none', zIndex: 1001 }}>
            <div className="glass-panel animate-slide-left" style={{
              height: 'calc(100% - 40px)',
              margin: '20px',
              width: '360px',
              pointerEvents: 'all',
              background: isDark ? 'rgba(9, 11, 15, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.2)'}`,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isDark ? '-20px 0 60px rgba(0,0,0,0.8)' : '-10px 0 40px rgba(0,0,0,0.05)',
              borderRadius: '28px',
              overflow: 'hidden',
              color: isDark ? 'white' : '#0f172a'
            }}>
              {/* Drawer Header */}
              <div style={{
                padding: '28px',
                background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.15), transparent)',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 15px #8b5cf6' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Concept Node</span>
                </div>
                <button
                  onClick={() => setSelectedNodeData(null)}
                  style={{ color: '#64748b', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  <Layout size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div style={{ padding: '32px 28px', flex: 1, overflowY: 'auto' }}>
                <h4 style={{ color: isDark ? 'white' : '#0f172a', fontSize: '1.75rem', marginBottom: '20px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                  {selectedNodeData.label}
                </h4>

                <div style={{
                  display: 'inline-flex',
                  marginBottom: '28px',
                  background: selectedNodeData.type === 'core' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                  color: selectedNodeData.type === 'core' ? '#8b5cf6' : '#0891b2',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  border: `1px solid ${selectedNodeData.type === 'core' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`
                }}>
                  {selectedNodeData.subLabel || (selectedNodeData.type === 'core' ? 'PRIMARY PILLAR' : 'SUPPORTING CONCEPT')}
                </div>

                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-28px', top: 0, bottom: 0, width: '4px', background: 'var(--accent-gradient)', opacity: 0.5, borderRadius: '0 4px 4px 0' }} />
                  <p style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '1.05rem', lineHeight: 1.8, fontWeight: 450 }}>
                    {selectedNodeData.details || "Generating deeper insights for this concept..."}
                  </p>
                </div>

                <div style={{ marginTop: '48px', padding: '24px', borderRadius: '20px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <Sparkles size={16} color="#8b5cf6" />
                    <span style={{ fontSize: '0.7rem', color: '#8b5cf6', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Quick Insight</span>
                  </div>
                  <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "This concept serves as a critical junction in the logical progression of ideas."
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div style={{ padding: '24px', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                <button
                  onClick={() => setSelectedNodeData(null)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '14px',
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    color: isDark ? 'white' : '#0f172a',
                    fontWeight: 700, fontSize: '0.9rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    cursor: 'pointer', transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'}
                >
                  Back to Map
                </button>
              </div>
            </div>
          </Panel>
        )}

        <Panel position="top-right" style={{ display: 'flex', gap: '12px', margin: '24px' }}>
          {!selectedNodeData && (
            <button
              onClick={onDownload}
              className="magic-reveal-btn"
              style={{
                background: 'var(--accent-gradient)',
                border: 'none',
                color: 'white',
                fontWeight: 800,
                padding: '12px 24px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <Download size={18} /> Export Map
            </button>
          )}
        </Panel>

        <Panel position="top-left" style={{ margin: '24px' }}>
          <div style={{
            background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            padding: '12px 20px',
            borderRadius: '16px',
            color: isDark ? 'rgba(255,255,255,0.9)' : '#0f172a',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            <Layout size={16} color="#06b6d4" /> Logical Flow Architecture
          </div>
        </Panel>

        <Panel position="bottom-left" style={{ margin: '24px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b', border: isDark ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} /> Core Pillar
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b', border: isDark ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} /> Supporting Concept
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default FlowRenderer;
