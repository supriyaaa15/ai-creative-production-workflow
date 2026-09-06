export default function CampaignExportBar({ job, keptCount, totalCount, onExport, exporting, exportError, downloadUrl, onBack }) {
  const progressPct = totalCount > 0 ? Math.round((job.completed_items / totalCount) * 100) : 0;
  const isRunning   = job.status === 'running' || job.status === 'pending';
  const canExport   = !exporting && !isRunning && keptCount > 0;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: 'rgba(244, 242, 238, 0.96)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        padding: '0 32px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>

        {/* Left — breadcrumb + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, minWidth: 0 }}>
          {onBack && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '-0.2px',
                color: 'var(--text-1)',
              }}>
                hexcoded
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-1)',
              flexShrink: 0,
              letterSpacing: '-0.1px',
            }}>
              {isRunning ? 'Generating' : `${keptCount} of ${totalCount} kept`}
            </p>

            {isRunning && totalCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 120,
                  height: 2,
                  borderRadius: 1,
                  background: 'var(--border)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 1,
                    background: 'var(--accent)',
                    width: `${progressPct}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {job.completed_items} / {totalCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right — export action */}
        {downloadUrl ? (
          <a href={downloadUrl} className="btn btn-primary btn-sm">
            Download campaign.zip
          </a>
        ) : (
          <button
            onClick={onExport}
            disabled={!canExport}
            title={
              isRunning      ? 'Wait for generation to complete'
              : keptCount === 0 ? 'Mark at least one variant to keep'
              : undefined
            }
            className="btn btn-secondary btn-sm"
          >
            {exporting ? 'Packaging…' : 'Export campaign'}
          </button>
        )}
      </div>
      {exportError && (
        <div style={{
          padding: '6px 32px',
          background: 'var(--danger-bg)',
          borderTop: '1px solid var(--danger-bd)',
          fontSize: 12,
          color: 'var(--danger)',
        }}>
          Export error: {exportError}
        </div>
      )}
    </div>
  );
}
