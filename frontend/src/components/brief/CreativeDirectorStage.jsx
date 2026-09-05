import { useEffect, useCallback, useState } from 'react';
import { api } from '../../lib/api.js';
import { ErrorBoundary } from '../common/ErrorBoundary.jsx';

/* ── Direction Card ─────────────────────────────────────────────────────
   All 3 cards share IDENTICAL layout — only content differs.
   ─────────────────────────────────────────────────────────────────────── */
function DirectionCard({ dir, index, onSelect, selected }) {
  const score     = typeof dir.score === 'number' ? dir.score.toFixed(1) : '—';
  const scoring   = dir.scoring || {};
  const subScores = [
    { key: 'audience_fit',    label: 'Audience' },
    { key: 'goal_fit',        label: 'Goal'     },
    { key: 'platform_fit',    label: 'Platform' },
    { key: 'visual_clarity',  label: 'Visual'   },
    { key: 'differentiation', label: 'Distinct' },
  ].filter((s) => scoring[s.key] != null);

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      boxShadow: selected ? '0 0 0 3px rgba(43,80,232,.1)' : 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>

      {/* ── Card header — identical across all cards ── */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="t-label">Option {String(index + 1).padStart(2, '0')}</span>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            AI SCORE {score} / 10
          </span>
        </div>
        <h3 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: '-0.2px',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {dir.name}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {dir.concept}
        </p>
      </div>

      {/* ── Card body — same section order every time ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

        {/* Strategy */}
        <div>
          <p className="t-label" style={{ marginBottom: 5 }}>Strategy</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
            {dir.strategy || '—'}
          </p>
        </div>

        {/* Visual Treatment */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '12px 14px',
        }}>
          <p className="t-label" style={{ marginBottom: 8 }}>Visual Treatment</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: dir.background ? 4 : 0 }}>
            {dir.composition || '—'}
          </p>
          {dir.background && (
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
              {dir.background}
            </p>
          )}
          {/* Colour swatches */}
          {(dir.primary_color || dir.accent_color) && (
            <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
              {[dir.primary_color, dir.accent_color].filter(Boolean).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: 2,
                    background: c, border: '1px solid rgba(0,0,0,.08)',
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)' }}>{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Message */}
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '12px 14px',
          textAlign: 'center',
        }}>
          <p className="t-label" style={{ marginBottom: 8 }}>Campaign Message</p>
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'var(--text-1)',
            marginBottom: dir.subheading ? 6 : 12,
            letterSpacing: '0.01em',
            lineHeight: 1.4,
          }}>
            "{dir.headline}"
          </p>
          {dir.subheading && (
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>{dir.subheading}</p>
          )}
          {(dir.cta || dir.CTA) && (
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: 'var(--text-1)',
              color: 'var(--bg)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              borderRadius: 'var(--radius-sm)',
              textTransform: 'uppercase',
            }}>
              {dir.cta || dir.CTA}
            </span>
          )}
        </div>

        {/* Why it works */}
        <div>
          <p className="t-label" style={{ marginBottom: 5 }}>Why it works</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, fontStyle: 'italic' }}>
            {dir.why_it_works ? `"${dir.why_it_works}"` : '—'}
          </p>
        </div>

        {/* Sub-scores */}
        {subScores.length > 0 && (
          <div>
            <p className="t-label" style={{ marginBottom: 8 }}>AI Scoring</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {subScores.map(({ key, label }) => {
                const val = scoring[key];
                const pct = Math.min(100, (val / 10) * 100);
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 54, fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 2, background: 'var(--surface-2)', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 1 }} />
                    </div>
                    <span style={{ width: 26, fontSize: 10, fontWeight: 600, color: 'var(--text-2)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {Number(val).toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── Footer CTA — fixed position, same height every card ── */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => onSelect(dir)}
          className={selected ? 'btn btn-accent' : 'btn btn-primary'}
          style={{ width: '100%' }}
        >
          {selected ? 'Direction selected' : 'Use this direction'}
        </button>
      </div>
    </div>
  );
}

/* ── Inner stage — fetches and renders directions ───────────────────── */
function CreativeDirectorInner({ brief, onSelectDirection, onBack }) {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [data, setData]             = useState(null);
  const [selected, setSelected]     = useState(null);

  const fetchDirections = useCallback(() => {
    setLoading(true);
    setError(null);
    api.proposeDirections(brief)
      .then((d) => {
        setData(d);
        setLoading(false);
        if (d?.source) {
          window.dispatchEvent(new CustomEvent('ai-source-changed', { detail: { source: d.source } }));
        }
      })
      .catch((err) => { setError(err.message || 'Failed to generate creative directions'); setLoading(false); });
  }, [brief]);

  useEffect(() => { fetchDirections(); }, [fetchDirections]);

  const handleSelect = (dir) => {
    setSelected(dir.id || dir.name);
    onSelectDirection(dir);
  };

  /* Loading */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
          {[0, 150, 300].map((delay) => (
            <span key={delay} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--accent)',
              animation: `subtle-pulse 1.3s ease-in-out ${delay}ms infinite`,
              display: 'inline-block',
            }} />
          ))}
        </div>
        <p style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-1)',
          marginBottom: 8,
          letterSpacing: '-0.2px',
        }}>
          Consulting AI Creative Director
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Qwen 2.5 3B is analysing your brief and generating three distinct creative directions.
        </p>
      </div>
    </div>
  );

  /* Error */
  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card card-body" style={{ maxWidth: 420, textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>
          Creative Director failed to load
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
          Check that the backend is running and Ollama is available.
        </p>
        <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)', marginBottom: 20, wordBreak: 'break-all' }}>
          {error}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={fetchDirections} className="btn btn-primary btn-sm">Retry</button>
          <button onClick={onBack} className="btn btn-secondary btn-sm">Back to brief</button>
        </div>
      </div>
    </div>
  );

  const directions = data?.directions || [];
  const isOllama   = data?.source?.includes('ollama');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Page header */}
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--text-3)', padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            ← Brief
          </button>
          <div className="stage-nav">
            <span>01 Brief</span>
            <span className="stage-sep">›</span>
            <span className="stage-active">02 Creative Director</span>
            <span className="stage-sep">›</span>
            <span>03 Production</span>
          </div>
        </div>
        <div
          className={`ai-pill ${isOllama ? 'ai-active' : ''}`}
          title={isOllama ? 'Generated by Ollama Qwen 2.5 3B' : 'Generated by local rule engine'}
        >
          <span className="ai-dot" />
          {isOllama ? 'LOCAL AI · QWEN 2.5 3B' : 'LOCAL RULE ENGINE'}
        </div>
      </header>

      {/* Page body */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--text-1)',
            letterSpacing: '-0.4px',
            marginBottom: 4,
          }}>
            AI Creative Director
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Select one creative direction to guide your production run.
          </p>
        </div>

        {/* Direction cards — 3 columns, fully symmetric */}
        <div className="direction-grid">
          {directions.map((dir, i) => (
            <DirectionCard
              key={dir.id || i}
              dir={dir}
              index={i}
              onSelect={handleSelect}
              selected={selected === (dir.id || dir.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Exported wrapper ───────────────────────────────────────────────── */
export default function CreativeDirectorStage(props) {
  return (
    <ErrorBoundary onBack={props.onBack}>
      <CreativeDirectorInner {...props} />
    </ErrorBoundary>
  );
}
