import { NODE_DEFS } from './nodeDefinitions.js';

/*
  Node config panel — dark, consistent with the canvas theme.
  Fixed 280px width, clean typography, no random colors.
*/
export default function NodeConfigPanel({ node, onChange, onClose }) {
  const panelStyle = {
    width: 280,
    flexShrink: 0,
    borderLeft: '1px solid var(--canvas-border)',
    background: 'var(--canvas-surface)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  if (!node) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: '20px 20px', flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--canvas-muted)', lineHeight: 1.6 }}>
            Select a node to view its configuration.
          </p>
        </div>
      </div>
    );
  }

  const def = NODE_DEFS[node.type];

  return (
    <div style={panelStyle}>
      {/* Panel header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--canvas-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--canvas-muted)', marginBottom: 2 }}>
            {def.step}
          </p>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--canvas-text)' }}>
            {def.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            color: 'var(--canvas-muted)',
            padding: '2px 4px',
            borderRadius: 3,
          }}
        >
          ✕
        </button>
      </div>

      {/* Panel body */}
      <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: 12, color: 'var(--canvas-muted)', lineHeight: 1.6, marginBottom: 16 }}>
          {def.description}
        </p>

        {def.terminal && (
          <div style={{
            marginBottom: 16,
            padding: '8px 12px',
            background: 'rgba(143, 82, 12, 0.1)',
            border: '1px solid rgba(143, 82, 12, 0.25)',
            borderRadius: 4,
            fontSize: 11,
            color: 'var(--warn)',
            lineHeight: 1.55,
          }}>
            Runs after review — not during generation.
          </div>
        )}

        {!def.configurable && (
          <p style={{ fontSize: 11, color: '#3e4150' }}>This step has no configurable settings.</p>
        )}

        {def.fields?.map((field) => (
          <div key={field.key} style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--canvas-muted)',
              marginBottom: 5,
            }}>
              {field.label}
            </label>

            {field.type === 'textarea' && (
              <textarea
                rows={3}
                placeholder={field.placeholder}
                value={node.config?.[field.key] || ''}
                onChange={(e) => onChange(node.id, { ...node.config, [field.key]: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--canvas-bg)',
                  border: '1px solid var(--canvas-border)',
                  borderRadius: 4,
                  padding: '7px 10px',
                  fontSize: 12,
                  color: 'var(--canvas-text)',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
            )}
            {field.type === 'text' && (
              <input
                value={node.config?.[field.key] || ''}
                onChange={(e) => onChange(node.id, { ...node.config, [field.key]: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--canvas-bg)',
                  border: '1px solid var(--canvas-border)',
                  borderRadius: 4,
                  padding: '7px 10px',
                  fontSize: 12,
                  color: 'var(--canvas-text)',
                  fontFamily: 'inherit',
                }}
              />
            )}
            {field.type === 'select' && (
              <select
                value={node.config?.[field.key] ?? field.options[0]}
                onChange={(e) => onChange(node.id, { ...node.config, [field.key]: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--canvas-bg)',
                  border: '1px solid var(--canvas-border)',
                  borderRadius: 4,
                  padding: '7px 10px',
                  fontSize: 12,
                  color: 'var(--canvas-text)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
