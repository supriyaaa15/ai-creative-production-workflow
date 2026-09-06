import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const STATUS_BADGE = {
  completed: { label: 'Done',    cls: 'badge badge-done'    },
  running:   { label: 'Running', cls: 'badge badge-running' },
  pending:   { label: 'Queued',  cls: 'badge badge-neutral' },
  failed:    { label: 'Failed',  cls: 'badge badge-failed'  },
};

function getStatusBadge(status) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.pending;
  return <span className={s.cls}>{s.label}</span>;
}

export default function DashboardPage({ onNew, onOpen }) {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const loadJobs = () => {
    setLoading(true);
    setError(null);
    api.listJobs()
      .then((res) => setJobs(res.jobs))
      .catch((err) => setError(err.message || 'Failed to load campaigns'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadJobs(); }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '-0.3px',
            color: 'var(--text-1)',
          }}>
            hexcoded
          </span>
          <nav>
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-1)',
              borderBottom: '1.5px solid var(--text-1)',
              paddingBottom: 1,
            }}>
              Campaigns
            </span>
          </nav>
        </div>
        <button onClick={onNew} className="btn btn-primary btn-sm">
          New campaign
        </button>
      </header>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px' }}>

        {/* Page heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--text-1)',
            letterSpacing: '-0.4px',
            marginBottom: 4,
          }}>
            Campaigns
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Batch creative runs, ready to review.
          </p>
        </div>

        {/* Loading shimmer */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer" style={{ height: 60, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div style={{
            border: '1px solid var(--danger-bd)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            background: 'var(--danger-bg)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', marginBottom: 6 }}>
              Could not reach backend
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{error}</p>
            <button onClick={loadJobs} className="btn btn-secondary btn-sm">Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && jobs.length === 0 && (
          <div style={{
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '56px 32px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>No campaigns yet</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
              Create one from a brief and a batch of product photos.
            </p>
            <button onClick={onNew} className="btn btn-primary btn-sm">
              New campaign
            </button>
          </div>
        )}

        {/* Job list */}
        {!loading && jobs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => onOpen(job.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 18px',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  transition: 'border-color 0.12s, background 0.12s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.background = 'var(--surface-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--surface)';
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-1)',
                    marginBottom: 3,
                    letterSpacing: '-0.1px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {job.brief?.goal || 'Untitled campaign'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {[job.brief?.audience, job.brief?.platform, `${job.total_items} assets × ${job.brief?.variant_count} variants`]
                      .filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {getStatusBadge(job.status)}
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(job.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
