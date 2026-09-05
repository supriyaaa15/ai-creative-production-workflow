import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function ModeIndicator() {
  const [health, setHealth] = useState(null);
  const [activeSource, setActiveSource] = useState(null);

  useEffect(() => {
    let mounted = true;
    const check = () => api.health()
      .then((d) => mounted && setHealth(d))
      .catch(() => mounted && setHealth((p) => (p ? { ...p, local_ai: false } : null)));

    check();
    const id = setInterval(check, 6000);

    const handleSourceChanged = (e) => {
      if (e.detail?.source && mounted) {
        setActiveSource(e.detail.source);
      }
    };

    window.addEventListener('ai-source-changed', handleSourceChanged);
    return () => {
      mounted = false;
      clearInterval(id);
      window.removeEventListener('ai-source-changed', handleSourceChanged);
    };
  }, []);

  if (!health && !activeSource) return null;

  const isOllamaSource = activeSource ? activeSource.includes('ollama') : Boolean(health?.local_ai || health?.ollama?.available);
  const model = health?.ollama?.model || 'qwen2.5:3b';

  return (
    <div
      title={isOllamaSource
        ? `Active AI: Ollama running locally via ${model}`
        : 'Active AI: Local rule-based fallback engine'}
      className={`ai-pill ${isOllamaSource ? 'ai-active' : 'ai-offline'}`}
      style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50, boxShadow: 'var(--shadow)' }}
    >
      <span className="ai-dot" style={{ background: isOllamaSource ? 'var(--success)' : 'var(--warn)' }} />
      {isOllamaSource ? `LOCAL AI · ${model.toUpperCase()}` : 'LOCAL RULE ENGINE'}
    </div>
  );
}

