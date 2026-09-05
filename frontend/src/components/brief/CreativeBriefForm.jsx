const PLATFORMS = ['Instagram', 'Web banner', 'Print', 'Email'];
const STYLES    = ['Minimal', 'Bold & vibrant', 'Editorial', 'Warm & natural'];

export default function CreativeBriefForm({ brief, onChange }) {
  const set = (key) => (e) => onChange({ ...brief, [key]: e.target.value });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div>
        <label className="form-label">Campaign goal</label>
        <input
          className="input"
          placeholder="e.g. Launch the Moto G06 Power as a long-lasting smartphone for everyday users"
          value={brief.goal}
          onChange={set('goal')}
        />
      </div>

      <div>
        <label className="form-label">Target audience</label>
        <input
          className="input"
          placeholder="e.g. Gen Z and young professionals, fitness-focused"
          value={brief.audience}
          onChange={set('audience')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="form-label">Visual style</label>
          <select className="select" value={brief.style} onChange={set('style')}>
            {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Platform</label>
          <select className="select" value={brief.platform} onChange={set('platform')}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label className="form-label" style={{ margin: 0 }}>Variants per asset</label>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
            {brief.variant_count}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={4}
          value={brief.variant_count}
          onChange={(e) => onChange({ ...brief, variant_count: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} style={{ fontSize: 11, color: 'var(--text-3)' }}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
