import fs from 'fs';
import { db } from './db/index.js';
import sharp from 'sharp';
import path from 'path';
import { OUTPUTS_DIR } from './lib/storage.js';

async function saveReport() {
  const rows = db.prepare(`
    SELECT v.variant_index, v.caption, v.creative_direction, v.image_url, b.platform, b.style, b.audience, b.goal
    FROM job_item_variants v
    JOIN job_items i ON v.job_item_id = i.id
    JOIN creative_briefs b ON i.job_id = b.job_id
    ORDER BY v.created_at DESC LIMIT 6
  `).all();

  const rev = rows.reverse();
  let out = '# CREATIVE PIPELINE MATRIX TEST REPORT\n';

  for (let i = 0; i < rev.length; i += 2) {
    const v0 = rev[i];
    const v1 = rev[i + 1];

    const dir0 = JSON.parse(v0.creative_direction);
    const dir1 = JSON.parse(v1.creative_direction);

    const meta0 = await sharp(path.join(OUTPUTS_DIR, path.basename(v0.image_url))).metadata();
    const meta1 = await sharp(path.join(OUTPUTS_DIR, path.basename(v1.image_url))).metadata();

    const testLetter = i === 0 ? 'A' : i === 2 ? 'B' : 'C';
    out += `\n## TEST ${testLetter}: Platform: ${v0.platform} | Style: ${v0.style} | Audience: ${v0.audience}\n`;
    out += `**Goal:** "${v0.goal}"\n\n`;

    out += `### Variant 1:\n`;
    out += `- **creative concept:** "${dir0.creative_concept}"\n`;
    out += `- **theme:** "${dir0.theme_style}"\n`;
    out += `- **composition:** "${dir0.composition}"\n`;
    out += `- **product placement:** "${dir0.product_placement}"\n`;
    out += `- **headline:** "${dir0.headline}"\n`;
    out += `- **caption:** "${v0.caption || dir0.caption}"\n`;
    out += `- **why_it_works:** "${dir0.why_it_works}"\n`;
    out += `- **score:** ${dir0.score}\n`;
    out += `- **rendered image dimensions:** ${meta0.width}x${meta0.height}\n\n`;

    out += `### Variant 2:\n`;
    out += `- **creative concept:** "${dir1.creative_concept}"\n`;
    out += `- **theme:** "${dir1.theme_style}"\n`;
    out += `- **composition:** "${dir1.composition}"\n`;
    out += `- **product placement:** "${dir1.product_placement}"\n`;
    out += `- **headline:** "${dir1.headline}"\n`;
    out += `- **caption:** "${v1.caption || dir1.caption}"\n`;
    out += `- **why_it_works:** "${dir1.why_it_works}"\n`;
    out += `- **score:** ${dir1.score}\n`;
    out += `- **rendered image dimensions:** ${meta1.width}x${meta1.height}\n\n`;
  }

  fs.writeFileSync(path.join(process.cwd(), 'matrix_report.md'), out, 'utf8');
  console.log('Saved matrix_report.md successfully');
}

saveReport().catch(console.error);
