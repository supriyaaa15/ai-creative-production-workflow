import { useMemo, useState, useCallback } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import NodeCard from './NodeCard.jsx';
import NodeConfigPanel from './NodeConfigPanel.jsx';
import { NODE_DEFS } from './nodeDefinitions.js';

const nodeTypes = { pipelineNode: NodeCard };

const X_STEP = 240;
const Y = 140;

export default function PipelineCanvas({ graph, onGraphChange, runState }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleToggle = useCallback((id) => {
    const next = {
      ...graph,
      nodes: graph.nodes.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)),
    };
    onGraphChange(next);
  }, [graph, onGraphChange]);

  const handleConfigChange = useCallback((id, config) => {
    const next = {
      ...graph,
      nodes: graph.nodes.map((n) => (n.id === id ? { ...n, config } : n)),
    };
    onGraphChange(next);
  }, [graph, onGraphChange]);

  const rfNodes = useMemo(() => graph.nodes.map((n, i) => ({
    id: n.id,
    type: 'pipelineNode',
    position: { x: i * X_STEP, y: Y },
    draggable: false,
    data: {
      id: n.id,
      type: n.type,
      enabled: n.enabled,
      status: runState?.nodeStatus?.[n.type],
      onToggle: handleToggle,
      onSelect: setSelectedId,
    },
  })), [graph, runState, handleToggle]);

  const rfEdges = useMemo(() => graph.edges.map((e) => {
    const targetNode = graph.nodes.find((n) => n.id === e.target);
    let cls = 'idle';
    if (targetNode?.enabled === false) {
      cls = 'skipped';
    } else {
      // Per-node status (keyed by node id, which matches node type in the default graph).
      // The target node's status drives its incoming edge, making the animation flow L→R.
      const nodeStatus = runState?.nodeStatus?.[e.target];
      if (nodeStatus === 'done') {
        cls = 'done';
      } else if (nodeStatus === 'running') {
        cls = 'running';
      } else if (runState?.status === 'completed') {
        // Fallback for edges whose target (e.g. 'export') has no per-node status.
        cls = 'done';
      } else if (runState?.status === 'running') {
        cls = 'running';
      }
    }
    return {
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      className: cls,
    };
  }), [graph, runState]);


  const selectedNode = graph.nodes.find((n) => n.id === selectedId) || null;

  return (
    <div className="flex h-full">
      <div className="flex-1">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          panOnScroll
        >
          <Background color="#2a2c33" gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <NodeConfigPanel
        node={selectedNode}
        onChange={handleConfigChange}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
