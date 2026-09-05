import express from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { enqueue } from '../worker/queue.js';
import { processVariant } from '../worker/processVariant.js';
import { buildCampaignExport } from '../lib/zip.js';
import { proposeCreativeDirections } from '../lib/ollama.js';

export const jobsRouter = express.Router();

// Demo-scale guardrails: keep the actual demo small, cheap, and reliable,
// while the schema/worker underneath supports larger batches unmodified.
const MAX_DEMO_ITEMS = Number(process.env.MAX_DEMO_ITEMS || 8);
const MAX_DEMO_VARIANTS = Number(process.env.MAX_DEMO_VARIANTS || 4);

jobsRouter.get('/', (req, res) => {
  const jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
  const withBriefs = jobs.map(job => {
    const brief = db.prepare('SELECT * FROM creative_briefs WHERE job_id = ?').get(job.id);
    if (brief && brief.selected_direction) {
      try { brief.selected_direction = JSON.parse(brief.selected_direction); } catch (e) {}
    }
    return { ...job, brief };
  });
  res.json({ jobs: withBriefs });
});

// Propose 3 Creative Directions for the AI Creative Director stage
jobsRouter.post('/propose-directions', async (req, res) => {
  try {
    const { brief } = req.body;
    console.log('\n=================== BRIEF RECEIVED ===================');
    console.log(JSON.stringify(brief, null, 2));
    const proposals = await proposeCreativeDirections(brief || {});
    console.log('\n===================== AI SOURCE =====================');
    console.log(proposals.source);
    console.log('\n================ DIRECTIONS GENERATED ================');
    console.log(JSON.stringify(proposals.directions?.map(d => ({ name: d.name, headline: d.headline, concept: d.concept, strategy: d.strategy })), null, 2));
    console.log('======================================================\n');
    res.json(proposals);
  } catch (err) {
    console.error('[Creative Director API Error]:', err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Create a campaign: brief + selected direction + batch + pipeline reference, in one call.
jobsRouter.post('/', (req, res) => {
  const { pipeline_id, brief, files } = req.body;

  if (!pipeline_id || !brief || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'pipeline_id, brief, and files[] are required' });
  }
  if (files.length > MAX_DEMO_ITEMS) {
    return res.status(400).json({
      error: `This demo is capped at ${MAX_DEMO_ITEMS} assets to keep runs fast and cheap. ` +
        `The pipeline itself supports larger batches once demo limits are lifted.`,
    });
  }
  const variantCount = Math.min(Number(brief.variant_count) || 2, MAX_DEMO_VARIANTS);
  const selectedDirStr = brief.selected_direction
    ? (typeof brief.selected_direction === 'string' ? brief.selected_direction : JSON.stringify(brief.selected_direction))
    : null;

  const jobId = uuid();
  db.prepare('INSERT INTO jobs (id, pipeline_id, status, total_items) VALUES (?, ?, ?, ?)')
    .run(jobId, pipeline_id, 'pending', files.length);

  db.prepare(`INSERT INTO creative_briefs (id, job_id, goal, audience, style, platform, variant_count, selected_direction)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuid(), jobId, brief.goal || '', brief.audience || '', brief.style || '', brief.platform || '', variantCount, selectedDirStr);

  for (const file of files) {
    db.prepare('INSERT INTO job_items (id, job_id, input_filename, input_url) VALUES (?, ?, ?, ?)')
      .run(uuid(), jobId, file.filename, file.storage_url);
  }

  res.json({ job_id: jobId, status: 'pending', item_count: files.length, variant_count: variantCount });
});

// Kick off the run: fan out job_items x variant_count into job_item_variants,
// enqueue one worker task per variant.
jobsRouter.post('/:jobId/run', (req, res) => {
  const { jobId } = req.params;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!job) return res.status(404).json({ error: 'not found' });

  const brief = db.prepare('SELECT * FROM creative_briefs WHERE job_id = ?').get(jobId);
  const items = db.prepare('SELECT * FROM job_items WHERE job_id = ?').all(jobId);

  db.prepare("UPDATE jobs SET status = 'running' WHERE id = ?").run(jobId);

  for (const item of items) {
    for (let i = 0; i < brief.variant_count; i++) {
      const variantId = uuid();
      db.prepare(`INSERT INTO job_item_variants (id, job_item_id, variant_index, status)
                  VALUES (?, ?, ?, 'pending')`).run(variantId, item.id, i);
      enqueue(() => processVariant({ variantId, itemId: item.id, jobId }));
    }
  }

  res.json({ status: 'running' });
});

// Poll endpoint — drives both the Progress and Results screens off one shape.
jobsRouter.get('/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!job) return res.status(404).json({ error: 'not found' });

  const brief = db.prepare('SELECT * FROM creative_briefs WHERE job_id = ?').get(jobId);
  if (brief && brief.selected_direction) {
    try { brief.selected_direction = JSON.parse(brief.selected_direction); } catch (e) {}
  }
  const items = db.prepare('SELECT * FROM job_items WHERE job_id = ?').all(jobId).map(item => {
    const variants = db.prepare('SELECT * FROM job_item_variants WHERE job_item_id = ? ORDER BY variant_index')
      .all(item.id)
      .map(v => ({
        ...v,
        node_progress: JSON.parse(v.node_progress || '{}'),
        creative_direction: v.creative_direction ? JSON.parse(v.creative_direction) : null,
        keep: !!v.keep
      }));
    return { ...item, variants };
  });

  res.json({ job, brief, items });
});

// Retry a single variant — untouched original, untouched siblings.
jobsRouter.post('/:jobId/items/:itemId/variants/:variantId/retry', (req, res) => {
  const { jobId, itemId, variantId } = req.params;
  db.prepare("UPDATE job_item_variants SET status = 'pending', error = NULL WHERE id = ?").run(variantId);
  db.prepare("UPDATE jobs SET status = 'running' WHERE id = ?").run(jobId);
  enqueue(() => processVariant({ variantId, itemId, jobId }));
  res.json({ status: 'running' });
});

// Caption edits / keep toggle for export selection.
jobsRouter.patch('/:jobId/items/:itemId/variants/:variantId', (req, res) => {
  const { variantId } = req.params;
  const { caption, keep } = req.body;
  if (caption !== undefined) {
    db.prepare('UPDATE job_item_variants SET caption = ? WHERE id = ?').run(caption, variantId);
  }
  if (keep !== undefined) {
    db.prepare('UPDATE job_item_variants SET keep = ? WHERE id = ?').run(keep ? 1 : 0, variantId);
  }
  const updated = db.prepare('SELECT * FROM job_item_variants WHERE id = ?').get(variantId);
  res.json({ ...updated, node_progress: JSON.parse(updated.node_progress || '{}'), keep: !!updated.keep });
});

// Terminal packaging step — runs over reviewed/kept variants
jobsRouter.post('/:jobId/export', async (req, res) => {
  const { jobId } = req.params;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!job) return res.status(404).json({ error: 'not found' });
  const brief = db.prepare('SELECT * FROM creative_briefs WHERE job_id = ?').get(jobId);
  if (brief && brief.selected_direction) {
    try { brief.selected_direction = JSON.parse(brief.selected_direction); } catch (e) {}
  }
  const items = db.prepare('SELECT * FROM job_items WHERE job_id = ?').all(jobId).map(item => ({
    ...item,
    variants: db.prepare('SELECT * FROM job_item_variants WHERE job_item_id = ?').all(item.id)
      .map(v => ({ ...v, keep: !!v.keep })),
  }));

  try {
    const { url } = await buildCampaignExport({ job, brief, items });
    res.json({ download_url: url });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});
