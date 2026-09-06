import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import CreativeBriefForm from '../components/brief/CreativeBriefForm.jsx';
import BatchUploadZone, { createDemoFile } from '../components/brief/BatchUploadZone.jsx';
import PipelineCanvas from '../components/canvas/PipelineCanvas.jsx';
import CreativeDirectorStage from '../components/brief/CreativeDirectorStage.jsx';

const DEFAULT_BRIEF = {
  goal: '',
  audience: '',
  style: 'Bold & vibrant',
  platform: 'Instagram',
  variant_count: 2,
};

function computeNodeStatus(items) {
  const all = items.flatMap((i) => i.variants);
  if (all.length === 0) return {};
  const nodeTypes = ['generate', 'upscale', 'caption'];
  const status = {};
  for (const type of nodeTypes) {
    const total = all.length;
    const doneCount = all.filter(
      (v) => v.node_progress[type] === 'done' || v.node_progress[type] === 'skipped',
    ).length;
    const anyInProgressForType = all.some(
      (v) => v.status === 'running' && !v.node_progress[type],
    );
    if (doneCount === total) {
      status[type] = 'done';
    } else if (doneCount > 0 || anyInProgressForType) {
      status[type] = 'running';
    } else {
      status[type] = 'idle';
    }
  }
  return status;
}

/* ── Step breadcrumb ────────────────────────────────────────────────── */
function StepNav({ current }) {
  const steps = [
    { id: 'brief',            label: '01 Brief' },
    { id: 'creative_director',label: '02 Creative Director' },
    { id: 'canvas',           label: '03 Production' },
    { id: 'running',          label: '04 Review' },
  ];
  return (
    <div className="stage-nav">
      {steps.map((s, i) => (
        <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span className="stage-sep">›</span>}
          <span className={s.id === current ? 'stage-active' : ''}>{s.label}</span>
        </span>
      ))}
    </div>
  );
}

/* ── Dark canvas header ─────────────────────────────────────────────── */
function CanvasHeader({ children }) {
  return (
    <div style={{
      padding: '0 24px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--canvas-border)',
      background: 'var(--canvas-surface)',
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

export default function NewCampaignPage({ onLaunched }) {
  const [step, setStep]                         = useState('brief');
  const [brief, setBrief]                       = useState(DEFAULT_BRIEF);
  const [files, setFiles]                       = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [pipelineId, setPipelineId]             = useState(null);
  const [graph, setGraph]                       = useState(null);
  const [launching, setLaunching]               = useState(false);
  const [error, setError]                       = useState(null);
  const [runningJobId, setRunningJobId]         = useState(null);
  const [runData, setRunData]                   = useState(null);

  /* Pre-create pipeline on mount */
  useEffect(() => {
    let active = true;
    api.createPipeline()
      .then((pipe) => {
        if (active) { setPipelineId(pipe.id); setGraph(pipe.graph_json); }
      })
      .catch((err) => console.warn('Failed to pre-create pipeline:', err));
    return () => { active = false; };
  }, []);

  /* Polling during run */
  useEffect(() => {
    if (step !== 'running' || !runningJobId) return;
    let stopped  = false;
    let interval;
    let navTimeout = null;
    const poll = async () => {
      try {
        const res = await api.getJob(runningJobId);
        setRunData(res);
        if (res.job.status === 'completed' || res.job.status === 'failed') {
          stopped = true;
          clearInterval(interval);
          navTimeout = setTimeout(() => onLaunched(runningJobId), 1500);
        }
      } catch { /* ignore transient */ }
    };
    poll();
    interval = setInterval(() => { if (!stopped) poll(); }, 2000);
    return () => {
      stopped = true;
      clearInterval(interval);
      if (navTimeout) clearTimeout(navTimeout);
    };
  }, [step, runningJobId, onLaunched]);

  const computedRunState = useMemo(() => {
    if (!runData) return { status: 'running', nodeStatus: {} };
    return {
      status: runData.job.status === 'completed' ? 'completed' : 'running',
      nodeStatus: computeNodeStatus(runData.items),
    };
  }, [runData]);

  /* Handlers */
  const goToCreativeDirector = () => {
    setError(null);
    if (files.length === 0) setFiles([createDemoFile()]);
    setStep('creative_director');
  };

  const handleDirectionSelected = async (direction) => {
    setSelectedDirection(direction);
    setError(null);
    try {
      if (!pipelineId || !graph) {
        const pipe = await api.createPipeline();
        setPipelineId(pipe.id);
        setGraph(pipe.graph_json);
      }
      setStep('canvas');
    } catch (err) {
      setError(err.message || 'Failed to initialize pipeline');
    }
  };

  const runCampaign = async () => {
    setLaunching(true);
    setError(null);
    try {
      let activePipelineId = pipelineId;
      if (!activePipelineId) {
        const pipe = await api.createPipeline();
        activePipelineId = pipe.id;
        setPipelineId(pipe.id);
        setGraph(pipe.graph_json);
      }
      await api.updatePipeline(activePipelineId, graph);
      const uploaded = await api.uploadFiles(files);
      const fullBrief = { ...brief, selected_direction: selectedDirection };
      const job = await api.createJob({
        pipeline_id: activePipelineId,
        brief: fullBrief,
        files: uploaded.files,
      });
      await api.runJob(job.job_id);
      setRunningJobId(job.job_id);
      setRunData(null);
      setStep('running');
    } catch (e) {
      setError(e.message || 'Something went wrong starting the run.');
    } finally {
      setLaunching(false);
    }
  };

  /* ── RUNNING / PIPELINE SCREEN ──────────────────────────────────── */
  if (step === 'running') {
    const allVariants   = runData ? runData.items.flatMap((i) => i.variants) : [];
    const totalVariants = allVariants.length;
    const doneVariants  = runData?.job.completed_items ?? 0;
    const pct           = totalVariants > 0 ? Math.round((doneVariants / totalVariants) * 100) : 0;
    const isComplete    = runData?.job.status === 'completed' || runData?.job.status === 'failed';

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas-bg)' }}>
        <CanvasHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, marginRight: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--canvas-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              {isComplete ? 'Pipeline complete' : 'Producing campaign variants…'}
            </span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--canvas-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {brief.goal || 'Untitled campaign'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
            {/* Progress */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'var(--canvas-muted)', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                {totalVariants === 0 ? 'Starting…' : `${doneVariants} / ${totalVariants} variants`}
              </p>
              <div style={{ width: 128, height: 2, borderRadius: 1, background: 'var(--canvas-border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 1,
                  background: 'var(--accent)',
                  width: totalVariants === 0 ? '4%' : `${pct}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
            <button
              onClick={() => onLaunched(runningJobId)}
              style={{
                height: 30,
                padding: '0 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.12s',
                ...(isComplete
                  ? { background: 'var(--success)', borderColor: 'var(--success)', color: '#fff' }
                  : { background: 'transparent', borderColor: 'var(--canvas-border)', color: 'var(--canvas-muted)' }
                ),
              }}
            >
              {isComplete ? 'View results →' : 'View results'}
            </button>
          </div>
        </CanvasHeader>

        {/* Node status strip */}
        {runData && (
          <div style={{
            padding: '8px 24px',
            borderBottom: '1px solid var(--canvas-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexShrink: 0,
            background: 'var(--canvas-surface)',
          }}>
            {['generate', 'upscale', 'caption'].map((type) => {
              const s = computedRunState.nodeStatus[type] || 'idle';
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: s === 'done' ? 'var(--success)' : s === 'running' ? 'var(--accent)' : '#373a48',
                    animation: s === 'running' ? 'subtle-pulse 1.4s ease-in-out infinite' : 'none',
                  }} />
                  <span style={{
                    fontSize: 11,
                    textTransform: 'capitalize',
                    color: s === 'idle' ? '#373a48' : s === 'done' ? 'var(--success)' : 'var(--canvas-muted)',
                    fontWeight: s === 'done' ? 600 : 400,
                    letterSpacing: '0.02em',
                  }}>
                    {type}{s === 'done' ? ' ✓' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          {graph ? (
            <PipelineCanvas graph={graph} onGraphChange={() => {}} runState={computedRunState} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--canvas-muted)' }}>Initializing workflow canvas…</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── CREATIVE DIRECTOR ──────────────────────────────────────────── */
  if (step === 'creative_director') {
    return (
      <CreativeDirectorStage
        brief={brief}
        onSelectDirection={handleDirectionSelected}
        onBack={() => setStep('brief')}
      />
    );
  }

  /* ── CANVAS / WORKFLOW ──────────────────────────────────────────── */
  if (step === 'canvas') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas-bg)' }}>
        <CanvasHeader>
          <div>
            <StepNav current="canvas" />
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--canvas-text)',
              marginTop: 4,
              letterSpacing: '-0.2px',
            }}>
              {brief.goal || 'Untitled campaign'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {selectedDirection && (
              <span style={{
                fontSize: 11,
                color: 'var(--canvas-muted)',
                letterSpacing: '0.04em',
              }}>
                Direction: <span style={{ color: 'var(--canvas-text)', fontWeight: 500 }}>{selectedDirection.name}</span>
              </span>
            )}
            <button
              onClick={runCampaign}
              disabled={launching}
              style={{
                height: 34,
                padding: '0 18px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: launching ? 'not-allowed' : 'pointer',
                opacity: launching ? 0.5 : 1,
                transition: 'opacity 0.12s',
                letterSpacing: '0.01em',
              }}
            >
              {launching
                ? 'Starting…'
                : `Run production — ${files.length} asset${files.length !== 1 ? 's' : ''} × ${brief.variant_count} variant${brief.variant_count !== 1 ? 's' : ''}`}
            </button>
          </div>
        </CanvasHeader>

        {error && (
          <div style={{
            padding: '10px 24px',
            borderBottom: '1px solid var(--danger-bd)',
            background: 'var(--danger-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>✕</button>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          {graph ? (
            <PipelineCanvas graph={graph} onGraphChange={setGraph} runState={{ status: 'idle' }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--canvas-muted)' }}>Initializing workflow canvas…</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── BRIEF SCREEN ───────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Light top header */}
      <header className="page-header">
        <StepNav current="brief" />
      </header>

      {/* Centered content */}
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Page heading */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--text-1)',
            letterSpacing: '-0.4px',
            marginBottom: 6,
          }}>
            New campaign
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
            Define your brief and upload source assets to consult the AI Creative Director.
          </p>
        </div>

        {/* Campaign brief section */}
        <div style={{ marginBottom: 32 }}>
          <p className="section-title">Campaign brief</p>
          <CreativeBriefForm brief={brief} onChange={setBrief} />
        </div>

        {/* Source assets section */}
        <div>
          <p className="section-title">Source assets</p>
          <BatchUploadZone files={files} onFilesChange={setFiles} />
        </div>

        {/* Error */}
        {error && (
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--danger)' }}>{error}</p>
        )}

        {/* Primary CTA */}
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={goToCreativeDirector}
            className="btn btn-primary btn-lg"
          >
            Continue to AI Creative Director →
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {files.length > 0 ? `${files.length} asset${files.length !== 1 ? 's' : ''} ready` : 'No assets — a demo will be used'}
          </span>
        </div>
      </div>
    </div>
  );
}
