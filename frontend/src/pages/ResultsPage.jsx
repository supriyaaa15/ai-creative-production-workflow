import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import AssetRow from '../components/results/AssetRow.jsx';
import CampaignExportBar from '../components/results/CampaignExportBar.jsx';

export default function ResultsPage({ jobId, onBack }) {
  const [data, setData]           = useState(null);
  const [pollError, setPollError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const pollRef = useRef(null);

  const startPoll = (id) => {
    if (pollRef.current) {
      pollRef.current.stopped = true;
      clearInterval(pollRef.current.interval);
    }
    const ctx = { stopped: false, interval: null };
    pollRef.current = ctx;

    const doPoll = async () => {
      try {
        const res = await api.getJob(id);
        if (ctx.stopped) return;
        setData(res);
        setPollError(null);
        if (res.job.status === 'completed' || res.job.status === 'failed') {
          ctx.stopped = true;
          clearInterval(ctx.interval);
        }
      } catch (err) {
        if (!ctx.stopped) setPollError(String(err.message || err));
      }
    };
    doPoll();
    ctx.interval = setInterval(() => { if (!ctx.stopped) doPoll(); }, 2000);
  };

  useEffect(() => {
    startPoll(jobId);
    return () => {
      if (pollRef.current) {
        pollRef.current.stopped = true;
        clearInterval(pollRef.current.interval);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  /* Loading state */
  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {pollError ? (
          <div className="card card-body" style={{ maxWidth: 420, textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>
              Failed to load campaign
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>{pollError}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => { setPollError(null); startPoll(jobId); }} className="btn btn-primary btn-sm">Retry</button>
              <button onClick={onBack} className="btn btn-secondary btn-sm">Back</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
              {[0, 150, 300].map((delay) => (
                <span key={delay} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: `subtle-pulse 1.2s ease-in-out ${delay}ms infinite`,
                  display: 'inline-block',
                }} />
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading campaign…</p>
          </div>
        )}
      </div>
    );
  }

  const { job, brief, items } = data;
  const allVariants = items.flatMap((i) => i.variants);
  const keptCount   = allVariants.filter((v) => v.keep && v.status === 'completed').length;

  const handleRetry = async (itemId, variantId) => {
    try {
      await api.retryVariant(jobId, itemId, variantId);
      // Restart polling so the UI refreshes when the variant processes
      startPoll(jobId);
    } catch (err) {
      console.error('Retry failed:', err.message);
    }
  };
  const handlePatch = async (itemId, variantId, patch) => {
    // Optimistically update local state for instant visual feedback
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              variants: item.variants.map((v) =>
                v.id === variantId ? { ...v, ...patch } : v
              ),
            }
          : item
      ),
    }));
    try {
      await api.patchVariant(jobId, itemId, variantId, patch);
    } catch (err) {
      // On failure re-poll to restore consistent state
      startPoll(jobId);
    }
  };
  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await api.exportCampaign(jobId);
      setDownloadUrl(res.download_url);
    } catch (err) {
      setExportError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sticky export bar */}
      <CampaignExportBar
        job={job}
        keptCount={keptCount}
        totalCount={allVariants.length}
        onExport={handleExport}
        exporting={exporting}
        exportError={exportError}
        downloadUrl={downloadUrl}
        onBack={onBack}
      />

      {/* Campaign header */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 0' }}>
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--text-3)',
              padding: 0,
              marginBottom: 12,
              display: 'block',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            ← Back to campaigns
          </button>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--text-1)',
            letterSpacing: '-0.3px',
            marginBottom: 4,
          }}>
            {brief.goal || 'Untitled campaign'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {[brief.audience, brief.style, brief.platform].filter(Boolean).join(' · ')}
          </p>
        </div>

        {pollError && (
          <div style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'var(--warn-bg)',
            border: '1px solid var(--warn-bd)',
            borderRadius: 'var(--radius)',
            fontSize: 12,
            color: 'var(--warn)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <span>Poll error — retrying: {pollError}</span>
            <button onClick={() => setPollError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--warn)', opacity: 0.6 }}>✕</button>
          </div>
        )}
        {exportError && (
          <div style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-bd)',
            borderRadius: 'var(--radius)',
            fontSize: 12,
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <span>Export failed: {exportError}</span>
            <button onClick={() => setExportError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)', opacity: 0.6 }}>✕</button>
          </div>
        )}
      </div>

      {/* Results area */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 80px' }}>
        {items.map((item) => (
          <AssetRow
            key={item.id}
            item={item}
            onRetryVariant={handleRetry}
            onPatchVariant={handlePatch}
          />
        ))}
      </div>
    </div>
  );
}
