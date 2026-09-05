import { db } from './db/index.js';
import sharp from 'sharp';
import path from 'path';
import { OUTPUTS_DIR } from './lib/storage.js';

async function printMatrix() {
  const rows = db.prepare(`
    SELECT v.variant_index, v.caption, v.creative_direction, v.image_url, b.platform, b.style, b.audience, b.goal
    FROM job_item_variants v
    JOIN job_items i ON v.job_item_id = i.id
    JOIN creative_briefs b ON i.job_id = b.job_id
    ORDER BY v.created_at DESC LIMIT 6
  `).all();

  const rev = rows.reverse();

  console.log('\n================ OFFICIAL 3-TEST CREATIVE MATRIX REPORT ================');

  for (let i = 0; i < rev.length; i += 2) {
    const v0 = rev[i];
    const v1 = rev[i + 1];

    const dir0 = JSON.parse(v0.creative_direction);
    const dir1 = JSON.parse(v1.creative_direction);

    const meta0 = await sharp(path.join(OUTPUTS_DIR, path.basename(v0.image_url))).metadata();
    const meta1 = await sharp(path.join(OUTPUTS_DIR, path.basename(v1.image_url))).metadata();

    const testLetter = i === 0 ? 'A' : i === 2 ? 'B' : 'C';
    console.log(`\n### TEST ${testLetter}: Platform: ${v0.platform} | Style: ${v0.style} | Audience: ${v0.audience}`);
    console.log(`Goal: "${v0.goal}"`);

    console.log(`\n  Variant 1:`);
    console.log(`    creative concept:  ${dir0.creative_concept}`);
    console.log(`    theme:             ${dir0.theme_style}`);
    console.log(`    composition:       ${dir0.composition}`);
    console.log(`    product placement: ${dir0.product_placement}`);
    console.log(`    headline:          ${dir0.headline}`);
    console.log(`    caption:           ${v0.caption || dir0.caption}`);
    console.log(`    why_it_works:      ${dir0.why_it_works}`);
    console.log(`    score:             ${dir0.score}`);
    console.log(`    image dimensions:  ${meta0.width}x${meta0.height}`);

    console.log(`\n  Variant 2:`);
    console.log(`    creative concept:  ${dir1.creative_concept}`);
    console.log(`    theme:             ${dir1.theme_style}`);
    console.log(`    composition:       ${dir1.composition}`);
    console.log(`    product placement: ${dir1.product_placement}`);
    console.log(`    headline:          ${dir1.headline}`);
    console.log(`    caption:           ${v1.caption || dir1.caption}`);
    console.log(`    why_it_works:      ${dir1.why_it_works}`);
    console.log(`    score:             ${dir1.score}`);
    console.log(`    image dimensions:  ${meta1.width}x${meta1.height}`);
  }
}

printMatrix().catch(console.error);
