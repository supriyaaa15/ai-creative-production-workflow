import VariantCard from './VariantCard.jsx';

export default function AssetRow({ item, onRetryVariant, onPatchVariant }) {
  return (
    <div style={{ paddingBottom: 40, marginBottom: 8, borderBottom: '1px solid var(--border)' }}>

      {/* Source asset label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingTop: 32 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--surface-2)',
        }}>
          <img
            src={item.input_url}
            alt={item.input_filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div>
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-1)',
            fontFamily: 'Space Grotesk, sans-serif',
            letterSpacing: '-0.1px',
            marginBottom: 2,
          }}>
            {item.input_filename}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {item.variants.length} variant{item.variants.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Variant grid — responsive 3→2→1 */}
      <div className="result-grid">
        {item.variants.map((v) => (
          <VariantCard
            key={v.id}
            variant={v}
            onRetry={() => onRetryVariant(item.id, v.id)}
            onPatch={(patch) => onPatchVariant(item.id, v.id, patch)}
          />
        ))}
      </div>
    </div>
  );
}
