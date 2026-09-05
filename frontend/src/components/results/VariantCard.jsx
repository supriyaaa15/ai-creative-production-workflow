import { useEffect, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';

/* Consistent recommendation badges */
const REC_BADGE = {
  Keep:    'badge badge-done',
  Reject:  'badge badge-failed',
  Consider:'badge badge-warn',
};

/*
  Every VariantCard has EXACTLY this structure:
  1. Generated creative preview (4:5 ratio)
  2. Variant metadata header
  3. AI Creative Direction block
  4. Caption area
  5. Footer action (Regenerate / Retry)
*/
export default function VariantCard({ variant, onRetry, onPatch }) {
  const [caption, setCaption] = useState(variant.caption || '');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setCaption(variant.caption || '');
  }, [variant.caption, editing]);

  const saveCaption = () => {
    setEditing(false);
    if (caption !== variant.caption) onPatch({ caption });
  };

  const dir            = variant.creative_direction || {};
  const concept        = dir.creative_concept || dir.concept || '—';
  const recommendation = variant.recommendation || dir.recommendation || 'Keep';
  const whyItWorks     = dir.why_it_works || '';
  const rawScore       = variant.score ?? dir.score ?? null;
  const score          = rawScore != null ? Number(rawScore).toFixed(1) : null;
  const isKept         = Boolean(variant.keep);

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isKept ? '#b6d9c4' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>

      {/* ── 1. Creative preview ── */}
      <div style={{
        position: 'relative',
        aspectRatio: '4/5',
        background: 'var(--surface-2)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {variant.image_url ? (
          <img
            src={variant.image_url}
            alt={`Variant ${variant.variant_index + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : variant.status === 'failed' ? (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}>
            <span style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'center', lineHeight: 1.5 }}>
              Generation failed
            </span>
          </div>
        ) : (
          <div className="shimmer" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        )}

        {/* Keep toggle */}
        <button
          onClick={() => onPatch({ keep: !variant.keep })}
          title={variant.keep ? 'Included in export — click to remove' : 'Click to include in export'}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: `2px solid ${isKept ? 'var(--success)' : 'rgba(255,255,255,0.6)'}`,
            background: isKept ? 'var(--success)' : 'rgba(255,255,255,0.85)',
            color: isKept ? '#fff' : 'var(--text-3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            transition: 'all 0.15s',
            backdropFilter: 'blur(4px)',
          }}
        >
          ✓
        </button>
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

        {/* ── 2. Variant metadata ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-1)',
            letterSpacing: '-0.1px',
          }}>
            Variant {variant.variant_index + 1}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {score && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--accent)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {score} / 10
              </span>
            )}
            <StatusBadge status={variant.status} />
          </div>
        </div>

        {/* ── 3. AI Creative Direction ── */}
        {variant.status === 'completed' && (
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 12px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span className="t-label">AI Creative Direction</span>
              <span className={REC_BADGE[recommendation] || REC_BADGE.Keep}>
                {recommendation}
              </span>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: whyItWorks ? 8 : 0 }}>
              {concept}
            </p>

            {whyItWorks && (
              <p className="truncate-2" style={{
                fontSize: 12,
                color: 'var(--text-3)',
                lineHeight: 1.55,
                fontStyle: 'italic',
                paddingTop: 8,
                borderTop: '1px solid var(--border)',
              }}>
                {whyItWorks}
              </p>
            )}
          </div>
        )}

        {/* ── 4. Caption ── */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <p className="t-label" style={{ marginBottom: 5 }}>Caption</p>
          {editing ? (
            <textarea
              autoFocus
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={saveCaption}
              className="textarea"
              style={{ fontSize: 12 }}
            />
          ) : (
            <p
              onClick={() => variant.caption && setEditing(true)}
              title={variant.caption ? 'Click to edit' : undefined}
              style={{
                fontSize: 12,
                color: variant.caption ? 'var(--text-2)' : 'var(--text-3)',
                lineHeight: 1.6,
                minHeight: 38,
                cursor: variant.caption ? 'text' : 'default',
                padding: '4px 0',
                fontStyle: variant.caption ? 'normal' : 'italic',
              }}
            >
              {variant.caption || (variant.status === 'failed' ? '—' : 'Generating caption…')}
            </p>
          )}
        </div>
      </div>

      {/* ── 5. Footer action ── */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
        {variant.status === 'failed' ? (
          <button onClick={onRetry} className="btn btn-danger btn-sm" style={{ width: '100%' }}>
            Retry
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', fontSize: 12 }}
          >
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}
