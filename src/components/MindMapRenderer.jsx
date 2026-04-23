import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  Handle,
  Position,
  getRectOfNodes,
  getTransformForBounds,
  useReactFlow,
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  ReactFlowProvider
} from '@xyflow/react';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';
import { Download, ChevronRight, ChevronDown, Share2, ZoomIn, Target } from 'lucide-react';

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const nodeWidth = 220;
  const nodeHeight = 60;
  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 120 });
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

const categoryColors = {
  theory: { bg: 'rgba(139, 92, 246, 0.9)', border: '#8b5cf6', accent: '#a78bfa' }, // Violet
  action: { bg: 'rgba(16, 185, 129, 0.9)', border: '#10b981', accent: '#34d399' }, // Emerald
  fact: { bg: 'rgba(6, 182, 212, 0.9)', border: '#06b6d4', accent: '#22d3ee' },   // Cyan
  meta: { bg: 'rgba(245, 158, 11, 0.9)', border: '#f59e0b', accent: '#fbbf24' },   // Gold
  root: { bg: 'var(--accent-gradient)', border: 'rgba(255,255,255,0.4)', accent: '#fff' }
};

const MindMapNode = ({ data, selected }) => {
  const isDark = data.isDark !== false;
  const isRoot = data.type === 'root';
  const hasChildren = data.childCount > 0;
  const theme = categoryColors[data.category] || categoryColors[data.type] || categoryColors.theory;

  return (
    <div style={{
      padding: isRoot ? '24px 32px' : '16px 24px',
      borderRadius: '24px',
      background: isRoot ? theme.bg : (isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)'),
      backdropFilter: 'blur(20px)',
      border: `2.5px solid ${selected ? (isDark ? '#fff' : theme.border) : (isRoot ? (isDark ? theme.border : 'rgba(0,0,0,0.1)') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'))}`,
      color: isDark ? 'white' : '#0f172a',
      minWidth: isRoot ? '260px' : '220px',
      textAlign: 'center',
      boxShadow: selected ? `0 0 30px ${theme.border}88` : (isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)'),
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden' // Ensure shimmer and top line are clipped to corners
    }}>
      {/* Premium Top Accent Line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: `linear-gradient(90deg, transparent, ${theme.border}, transparent)`,
        opacity: 0.8
      }} />

      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{ fontSize: isRoot ? '1.2rem' : '1.05rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '0.65rem', color: isRoot ? 'rgba(255,255,255,0.8)' : theme.accent, textTransform: 'uppercase', fontWeight: 800, marginTop: '4px', letterSpacing: '0.12em' }}>
        {data.category || data.type}
      </div>
      {hasChildren && (
        <div style={{
          marginTop: '12px', fontSize: '0.65rem', color: '#94a3b8',
          background: 'rgba(0,0,0,0.4)', padding: '5px 12px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {data.isCollapsed ? <ChevronRight size={10} style={{ display: 'inline-block', marginRight: '4px' }} /> : <ChevronDown size={10} style={{ display: 'inline-block', marginRight: '4px' }} />} {data.childCount} Branches
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

const MindMapEdge = ({ id, sourceX, sourceY, targetX, targetY, label, style, data }) => {
  const isDark = data?.isDark !== false;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition: Position.Right, targetX, targetY, targetPosition: Position.Left,
  });
  return (
    <>
      {/* Outer Glow Path */}
      <BaseEdge path={edgePath} style={{
        stroke: '#06b6d4',
        strokeWidth: isDark ? 4 : 2,
        opacity: isDark ? 0.3 : 0.1,
        filter: isDark ? 'blur(3px)' : 'none'
      }} />
      {/* Inner Neon Path */}
      <BaseEdge path={edgePath} style={{
        stroke: isDark ? 'white' : '#0891b2',
        strokeWidth: 1.5,
        opacity: isDark ? 0.5 : 0.8,
      }} />
      {label && (
        <EdgeLabelRenderer>
          <div style={{
            position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: isDark ? '#0d0f14' : '#ffffff', padding: '4px 10px', borderRadius: '6px',
            fontSize: '0.65rem', color: isDark ? '#06b6d4' : '#0891b2', border: `1px solid ${isDark ? '#06b6d4' : 'rgba(8, 145, 178, 0.2)'}`,
            pointerEvents: 'none', fontWeight: 800, textTransform: 'uppercase',
            boxShadow: isDark ? '0 0 15px rgba(6, 182, 212, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)', zIndex: 10
          }}>
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = { mindmap: MindMapNode };
const edgeTypes = { mindmap: MindMapEdge };

const MindMapContent = ({ treeData, isDark = true }) => {
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const { fitView } = useReactFlow();

  // 1. Calculate static layout for the FULL tree once to ensure nodes stay pinned
  const staticLayout = useMemo(() => {
    if (!treeData) return { nodes: [], edges: [], positions: {} };

    // Function to extract ALL nodes and edges regardless of collapse state
    const extractAll = (node, level = 0) => {
      const nodes = [{
        id: node.id,
        type: 'mindmap',
        data: { label: node.label, type: node.type || (level === 0 ? 'root' : 'branch'), category: node.category, childCount: node.children?.length || 0, isDark },
        position: { x: 0, y: 0 }
      }];
      let edges = [];
      if (node.children) {
        node.children.forEach(child => {
          const res = extractAll(child, level + 1);
          nodes.push(...res.nodes);
          edges.push({
            id: `e-${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            label: child.edgeLabel,
            type: 'mindmap',
            data: { isDark }
          });
          edges.push(...res.edges);
        });
      }
      return { nodes, edges };
    };

    const all = extractAll(treeData);
    const layouted = getLayoutedElements(all.nodes, all.edges);

    // Map of ID -> Position
    const posMap = {};
    layouted.nodes.forEach(n => { posMap[n.id] = n.position; });

    return { allNodes: layouted.nodes, allEdges: layouted.edges, posMap };
  }, [treeData]);

  // Helper to get nodes on path (IDs only)
  const getPathIds = (targetId) => {
    if (!targetId || !treeData) return new Set();
    let ids = new Set();
    const find = (node, currentPath) => {
      if (node.id === targetId) {
        currentPath.forEach(id => ids.add(id));
        ids.add(node.id);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (find(child, [...currentPath, node.id])) return true;
        }
      }
      return false;
    };
    find(treeData, []);
    return ids;
  };

  // BFS to find the path for breadcrumbs (labels only)
  const getPathLabels = (targetId) => {
    if (!targetId || !treeData) return [];
    let labels = [];
    const find = (node, currentPath) => {
      if (node.id === targetId) {
        labels = [...currentPath, node.label];
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (find(child, [...currentPath, node.label])) return true;
        }
      }
      return false;
    };
    find(treeData, []);
    return labels;
  };

  const activePathIds = useMemo(() => getPathIds(selectedNodeId), [selectedNodeId, treeData]);
  const breadcrumbs = useMemo(() => getPathLabels(selectedNodeId), [selectedNodeId, treeData]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    if (node.id === selectedNodeId && node.data.childCount > 0) {
      const next = new Set(collapsedNodes);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      setCollapsedNodes(next);
    }
  }, [selectedNodeId, collapsedNodes]);

  // 2. Filter nodes based on current collapse/focus state, but use FIXED positions
  const processTree = useCallback((node, level = 0, parentHidden = false) => {
    if (!node) return { nodes: [], edges: [] };

    const isCollapsed = collapsedNodes.has(node.id);
    const inActivePath = activePathIds.has(node.id);

    // Visibility logic
    const hiddenByFocus = isFocusMode && !inActivePath && (level > 0);
    const hiddenByParent = parentHidden;
    const isHidden = hiddenByFocus || hiddenByParent;

    const nodes = [{
      id: node.id,
      type: 'mindmap',
      data: {
        label: node.label,
        type: node.type || (level === 0 ? 'root' : 'branch'),
        category: node.category,
        childCount: node.children?.length || 0,
        isCollapsed,
        isDark
      },
      position: staticLayout.posMap[node.id] || { x: 0, y: 0 },
      hidden: isHidden
    }];

    let edges = [];
    if (node.children) {
      node.children.forEach(child => {
        const result = processTree(child, level + 1, isHidden || isCollapsed);
        nodes.push(...result.nodes);
        edges.push({
          id: `e-${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          label: child.edgeLabel,
          type: 'mindmap',
          hidden: isHidden || isCollapsed || result.nodes[0]?.hidden,
          data: { isDark }
        });
        edges.push(...result.edges);
      });
    }
    return { nodes, edges };
  }, [collapsedNodes, isFocusMode, activePathIds, staticLayout.posMap]);

  const { visibleNodes, visibleEdges } = useMemo(() => {
    const result = processTree(treeData);
    return {
      visibleNodes: result.nodes.filter(n => !n.hidden),
      visibleEdges: result.edges.filter(e => !e.hidden)
    };
  }, [treeData, processTree]);

  const [nodes, setNodes, onNodesChange] = useNodesState(visibleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(visibleEdges);

  useEffect(() => {
    setNodes(visibleNodes);
    setEdges(visibleEdges);
    // Only refit if it's the initial load or a major structural change, not on every click
  }, [visibleNodes, visibleEdges, setNodes, setEdges]);

  const onDownload = () => {
    toPng(document.querySelector('.react-flow__viewport'), {
      backgroundColor: isDark ? '#0d0f14' : '#f8fafc', width: 2400, height: 1600,
      style: { width: 2400, height: 1600 },
    }).then(url => {
      const a = document.createElement('a');
      a.download = `mindmap-${Date.now()}.png`; a.href = url; a.click();
    });
  };

  if (!treeData) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Analyzing branches...</div>;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={() => setIsFocusMode(!isFocusMode)}
          className="magic-reveal-btn"
          style={{ background: 'var(--accent-gradient)', color: 'white', fontWeight: 700, marginTop: 0 }}
        >
          <ZoomIn size={16} /> {isFocusMode ? 'Focus On' : 'Full Map'}
        </button>
        <button onClick={onDownload} className="magic-reveal-btn" style={{ background: 'var(--accent-gradient)', color: 'white', fontWeight: 700, marginTop: 0 }}>
          <Download size={16} /> Save Map
        </button>
      </div>


      <div style={{
        width: '100%',
        height: '600px',
        background: isDark ? '#0d0f14' : '#ffffff',
        borderRadius: '32px',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isDark ? 'none' : '0 10px 40px rgba(0,0,0,0.03)'
      }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.05}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          zoomOnScroll={false}
          zoomOnPinch={false}
          style={{ width: '100%', height: '100%' }}
        >
          <Background color={isDark ? "#1e293b" : "#cbd5e1"} gap={24} size={1} variant="dots" />

          {/* Integrated Breadcrumbs Panel */}
          <Panel position="top-center" style={{
            marginTop: '20px',
            maxWidth: '40%',
            pointerEvents: 'none' // Allow clicking through to nodes if needed, but the span has its own style
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '20px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(139, 92, 246, 0.2)'}`,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              pointerEvents: 'auto'
            }}>
              <Target size={14} color="#8b5cf6" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {breadcrumbs.length === 0 && <span style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>Explore the map</span>}
                {breadcrumbs.map((step, i) => (
                  <React.Fragment key={i}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: i === breadcrumbs.length - 1 ? (isDark ? '#fff' : '#1e293b') : (isDark ? '#94a3b8' : '#64748b'),
                      fontWeight: i === breadcrumbs.length - 1 ? 700 : 500,
                      whiteSpace: 'nowrap'
                    }}>{step}</span>
                    {i < breadcrumbs.length - 1 && <ChevronRight size={10} color={isDark ? "#334155" : "#cbd5e1"} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </Panel>

          <Panel position="top-left" style={{ margin: '20px' }}>
            <div className="status-pill status-live" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', color: '#06b6d4', opacity: 0.8 }}>
              🧠 INTELLIGENT MIND MAP
            </div>
          </Panel>
        </ReactFlow>

        <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '12px' }}>
          {Object.entries(categoryColors).map(([cat, theme]) => (
            <div key={cat} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.65rem',
              color: isDark ? '#94a3b8' : '#64748b',
              background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
              padding: '4px 8px',
              borderRadius: '8px',
              border: isDark ? 'none' : '1px solid rgba(0,0,0,0.05)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.border }} />
              {cat.toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MindMapRenderer = (props) => (
  <ReactFlowProvider>
    <MindMapContent {...props} />
  </ReactFlowProvider>
);

export default MindMapRenderer;
