import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { EXPORTS_DIR, localPathForOutputUrl, localPathForUploadUrl } from './storage.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:8787';

// Export is treated as a terminal, non-AI packaging step: it runs after
// review/selection, over whatever already exists in job_item_variants
// (keep = true), and does no generation of its own.
export function buildCampaignExport({ job, brief, items }) {
  return new Promise((resolve, reject) => {
    const filename = `campaign_${job.id}.zip`;
    const outPath = path.join(EXPORTS_DIR, filename);
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve({ url: `${PUBLIC_BASE}/files/exports/${filename}` });
    });
    archive.on('error', reject);
    archive.pipe(output);

    archive.append(JSON.stringify(brief, null, 2), { name: 'brief.json' });

    for (const item of items) {
      const folder = safeFolderName(item.input_filename);
      try {
        archive.file(localPathForUploadUrl(item.input_url), { name: `${folder}/original${path.extname(item.input_filename) || '.jpg'}` });
      } catch (e) { /* ignore missing original */ }

      const kept = item.variants.filter(v => v.keep && v.image_url && v.status === 'completed');
      const captions = {};
      for (const v of kept) {
        try {
          archive.file(localPathForOutputUrl(v.image_url), { name: `${folder}/variant_${v.variant_index}.png` });
        } catch (e) { /* skip missing file */ }
        captions[`variant_${v.variant_index}`] = v.caption || '';
      }
      archive.append(JSON.stringify(captions, null, 2), { name: `${folder}/captions.json` });
    }

    archive.finalize();
  });
}

function safeFolderName(filename) {
  return path.parse(filename).name.replace(/[^a-z0-9_-]/gi, '_');
}
