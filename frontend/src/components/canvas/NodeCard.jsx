import { Handle, Position } from 'reactflow';
import { NODE_DEFS } from './nodeDefinitions.js';

export default function NodeCard({ data, selected }) {
  const def = NODE_DEFS[data.type];
  if (!def) return null;

  const enabled = data.enabled !== false;
  const status  = data.status; // 'idle' | 'running' | 'done'

  const borderColor = selected
    ? 'var(--accent)'
    : status === 'done'
    ? '#2a4d38'
    : status === 'running'
    ? '#1f2d52'
    : enabled
    ? 'var(--canvas-border)'
    : '#1e1f26';

  return (
    <div
      style={{
        width: 200,
        padding: '12px 14px',
        borderRadius: 6,
        border: `1px solid ${borderColor}`,
        background: enabled ? 'var(--canvas-surface)' : '#121418',
        opacity: enabled ? 1 : 0.55,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: selected ? `0 0 0 3px rgba(43,80,232,.15)` : 'none',
      }}
      onClick={() => data.onSelect?.(data.id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#3a3d4a', width: 7, height: 7, border: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--canvas-muted)',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}>
            {def.step}
          </span>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--canvas-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {def.label}
          </span>
        </div>

        {/* Status dot */}
        {status === 'running' && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)',
            flexShrink: 0,
            animation: 'subtle-pulse 1.3s ease-in-out infinite',
          }} />
        )}
        {status === 'done' && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--success)',
            flexShrink: 0,
          }} />
        )}
      </div>

      <p style={{
        fontSize: 11,
        color: 'var(--canvas-muted)',
        lineHeight: 1.5,
        marginBottom: def.toggleable ? 10 : 0,
      }}>
        {def.description}
      </p>

      {/* Toggle button — only for toggleable nodes */}
      {def.toggleable && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onToggle?.(data.id); }}
          style={{
            display: 'block',
            marginTop: 8,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 3,
            border: `1px solid ${enabled ? 'var(--accent)' : 'var(--canvas-border)'}`,
            background: 'transparent',
            color: enabled ? 'var(--accent)' : 'var(--canvas-muted)',
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
        >
          {enabled ? 'Enabled' : 'Skipped'}
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#3a3d4a', width: 7, height: 7, border: 'none' }}
      />
    </div>
  );
}
