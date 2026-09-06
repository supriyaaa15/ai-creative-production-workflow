import fs from 'fs';
import { db } from '../db/index.js';
import { generateVariant } from '../lib/generate.js';
import { upscaleImage } from '../lib/upscale.js';
import { captionImage } from '../lib/caption.js';
import { localPathForUploadUrl } from '../lib/storage.js';

function getNode(graph, type) {
  return graph.nodes.find(n => n.type === type);
}

function setVariantProgress(variantId, patch) {
  const row = db.prepare('SELECT node_progress FROM job_item_variants WHERE id = ?').get(variantId);
  const progress = JSON.parse(row?.node_progress || '{}');
  Object.assign(progress, patch);
  db.prepare('UPDATE job_item_variants SET node_progress = ? WHERE id = ?')
    .run(JSON.stringify(progress), variantId);
}

// Runs Generate -> Upscale -> Caption for a single variant, honoring each
// node's enabled flag. Export is intentionally NOT part of this sequence —
// it's a terminal packaging step that runs later, over reviewed/kept
// variants, not a per-variant AI processing step. See lib/zip.js.
export async function processVariant({ variantId, itemId, jobId }) {
  const variant = db.prepare('SELECT * FROM job_item_variants WHERE id = ?').get(variantId);
  const item = db.prepare('SELECT * FROM job_items WHERE id = ?').get(itemId);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  const pipeline = db.prepare('SELECT * FROM pipelines WHERE id = ?').get(job.pipeline_id);
  const brief = db.prepare('SELECT * FROM creative_briefs WHERE job_id = ?').get(jobId);
  const graph = JSON.parse(pipeline.graph_json);

  db.prepare("UPDATE job_item_variants SET status = 'running', error = NULL WHERE id = ?").run(variantId);

  try {
    let currentUrl = item.input_url;
    let currentLocalPath = localPathForUploadUrl(item.input_url);
    let currentBuffer = fs.readFileSync(currentLocalPath);

    let creativeResult = null;
    const generateNode = getNode(graph, 'generate');
    if (!generateNode || generateNode.enabled !== false) {
      // Fetch already processed sibling creative directions to enforce campaign-wide anti-duplication
      const siblingRows = db.prepare('SELECT creative_direction FROM job_item_variants WHERE job_item_id = ? AND id != ? AND creative_direction IS NOT NULL').all(itemId, variantId);
      const existingDirections = siblingRows.map(r => {
        try { return JSON.parse(r.creative_direction); } catch (e) { return null; }
      }).filter(Boolean);

      creativeResult = await generateVariant({
        inputBuffer: currentBuffer,
        inputUrl: currentUrl,
        brief,
        nodeConfig: generateNode?.config || {},
        variantIndex: variant.variant_index,
        totalVariants: brief?.variant_count || 2,
        existingDirections,
      });
      currentUrl = creativeResult.url;
      currentLocalPath = creativeResult.localPath;
      setVariantProgress(variantId, { generate: 'done' });
    } else {
      setVariantProgress(variantId, { generate: 'skipped' });
    }

    const upscaleNode = getNode(graph, 'upscale');
    if (upscaleNode?.enabled) {
      const result = await upscaleImage({
        imageUrl: currentUrl,
        localPath: currentLocalPath,
        nodeConfig: upscaleNode.config || {},
      });
      currentUrl = result.url;
      currentLocalPath = result.localPath;
      setVariantProgress(variantId, { upscale: 'done' });
    } else {
      setVariantProgress(variantId, { upscale: 'skipped' });
    }

    let caption = null;
    const captionNode = getNode(graph, 'caption');
    if (!captionNode || captionNode.enabled !== false) {
      caption = await captionImage({
        imageUrl: currentUrl,
        localPath: currentLocalPath,
        brief,
        nodeConfig: captionNode?.config || {},
        variantIndex: variant.variant_index,
        creativeDirection: creativeResult?.creativeDirection,
      });
      setVariantProgress(variantId, { caption: 'done' });
    } else {
      setVariantProgress(variantId, { caption: 'skipped' });
    }

    db.prepare(`
      UPDATE job_item_variants
      SET status = 'completed',
          image_url = ?,
          caption = ?,
          creative_direction = ?,
          score = ?,
          recommendation = ?
      WHERE id = ?
    `).run(
      currentUrl,
      caption,
      creativeResult?.creativeDirection ? JSON.stringify(creativeResult.creativeDirection) : null,
      creativeResult?.score ?? null,
      creativeResult?.recommendation ?? null,
      variantId
    );
  } catch (err) {
    console.error(`[Worker Error] processVariant failed for variant ${variantId} (item ${itemId}, job ${jobId}):`, err);
    db.prepare(`UPDATE job_item_variants SET status = 'failed', error = ? WHERE id = ?`)
      .run(String(err.message || err), variantId);
  }

  recomputeJobProgress(jobId);
}

function recomputeJobProgress(jobId) {
  const items = db.prepare('SELECT id FROM job_items WHERE job_id = ?').all(jobId);
  let totalVariants = 0;
  let doneVariants = 0;
  for (const item of items) {
    const variants = db.prepare('SELECT status FROM job_item_variants WHERE job_item_id = ?').all(item.id);
    totalVariants += variants.length;
    doneVariants += variants.filter(v => v.status === 'completed' || v.status === 'failed').length;
  }
  const allDone = totalVariants > 0 && doneVariants === totalVariants;
  db.prepare('UPDATE jobs SET completed_items = ?, status = ? WHERE id = ?')
    .run(doneVariants, allDone ? 'completed' : 'running', jobId);
}
