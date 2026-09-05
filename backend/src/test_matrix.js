import { db } from './db/index.js';
import { v4 as uuid } from 'uuid';
import { processVariant } from './worker/processVariant.js';
import path from 'path';
import sharp from 'sharp';
import { UPLOADS_DIR, OUTPUTS_DIR } from './lib/storage.js';

async function runMatrixTest() {
  console.log('================ STARTING CREATIVE PIPELINE MATRIX TEST ================');

  // Create sample black shoe input image
  const sampleFilename = `black_shoe_${Date.now()}.png`;
  const samplePath = path.join(UPLOADS_DIR, sampleFilename);
  await sharp({ create: { width: 500, height: 500, channels: 4, background: { r: 15, g: 15, b: 20, alpha: 1 } } })
    .png().toFile(samplePath);
  const sampleUrl = `http://localhost:8787/files/uploads/${sampleFilename}`;

  const pipeline = db.prepare('SELECT id FROM pipelines LIMIT 1').get();
  const pipelineId = pipeline.id;

  const testCases = [
    {
      label: 'TEST A: Instagram + Bold & vibrant + Gen Z',
      platform: 'Instagram',
      style: 'Bold & vibrant',
      audience: 'Gen Z',
      goal: 'Launch urban speed shoe collection',
    },
    {
      label: 'TEST B: Instagram + Minimal + Professional marathon runners',
      platform: 'Instagram',
      style: 'Minimal',
      audience: 'Professional marathon runners',
      goal: 'Promote marathon endurance footwear',
    },
    {
      label: 'TEST C: Web banner + Bold & vibrant + Gen Z',
      platform: 'Web banner',
      style: 'Bold & vibrant',
      audience: 'Gen Z',
      goal: 'Drive web store launch for black shoes',
    },
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`\n---------------- EXECUTING ${tc.label} ----------------`);
    
    const jobId = uuid();
    db.prepare('INSERT INTO jobs (id, pipeline_id, status, total_items) VALUES (?, ?, ?, ?)').run(jobId, pipelineId, 'pending', 1);

    const briefId = uuid();
    db.prepare('INSERT INTO creative_briefs (id, job_id, goal, audience, style, platform, variant_count) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(briefId, jobId, tc.goal, tc.audience, tc.style, tc.platform, 2);

    const itemId = uuid();
    db.prepare('INSERT INTO job_items (id, job_id, input_filename, input_url) VALUES (?, ?, ?, ?)').run(itemId, jobId, sampleFilename, sampleUrl);

    const var0Id = uuid();
    const var1Id = uuid();
    db.prepare('INSERT INTO job_item_variants (id, job_item_id, variant_index, status) VALUES (?, ?, ?, ?)').run(var0Id, itemId, 0, 'pending');
    db.prepare('INSERT INTO job_item_variants (id, job_item_id, variant_index, status) VALUES (?, ?, ?, ?)').run(var1Id, itemId, 1, 'pending');

    console.log(`Processing Variant 0 for ${tc.platform}...`);
    await processVariant({ variantId: var0Id, itemId, jobId });

    console.log(`Processing Variant 1 for ${tc.platform}...`);
    await processVariant({ variantId: var1Id, itemId, jobId });

    const v0 = db.prepare('SELECT * FROM job_item_variants WHERE id = ?').get(var0Id);
    const v1 = db.prepare('SELECT * FROM job_item_variants WHERE id = ?').get(var1Id);

    const dir0 = JSON.parse(v0.creative_direction);
    const dir1 = JSON.parse(v1.creative_direction);

    // Read Sharp rendered output metadata
    const meta0 = await sharp(path.join(OUTPUTS_DIR, path.basename(v0.image_url))).metadata();
    const meta1 = await sharp(path.join(OUTPUTS_DIR, path.basename(v1.image_url))).metadata();

    results.push({
      testLabel: tc.label,
      variants: [
        {
          index: 0,
          concept: dir0.creative_concept,
          theme: dir0.theme_style,
          composition: dir0.composition,
          product_placement: dir0.product_placement,
          headline: dir0.headline,
          caption: v0.caption || dir0.caption,
          why_it_works: dir0.why_it_works,
          score: dir0.score,
          dimensions: `${meta0.width}x${meta0.height}`,
          source: dir0.source,
        },
        {
          index: 1,
          concept: dir1.creative_concept,
          theme: dir1.theme_style,
          composition: dir1.composition,
          product_placement: dir1.product_placement,
          headline: dir1.headline,
          caption: v1.caption || dir1.caption,
          why_it_works: dir1.why_it_works,
          score: dir1.score,
          dimensions: `${meta1.width}x${meta1.height}`,
          source: dir1.source,
        },
      ]
    });
  }

  console.log('\n================ FINAL MATRIX REPORT ================');
  for (const r of results) {
    console.log(`\n>>> ${r.testLabel} <<<`);
    for (const v of r.variants) {
      console.log(`  [Variant ${v.index + 1}]`);
      console.log(`    creative concept:  "${v.concept}"`);
      console.log(`    theme:             "${v.theme}"`);
      console.log(`    composition:       "${v.composition}"`);
      console.log(`    product placement: "${v.product_placement}"`);
      console.log(`    headline:          "${v.headline}"`);
      console.log(`    caption:           "${v.caption}"`);
      console.log(`    why_it_works:      "${v.why_it_works}"`);
      console.log(`    score:             ${v.score}`);
      console.log(`    image dimensions:  ${v.dimensions}`);
      console.log(`    source:            ${v.source}`);
    }
  }

  // Assertions
  console.log('\n================ ASSERTIONS REPORT ================');
  const webBannerWidth = results[2].variants[0].dimensions;
  const isWideBanner = webBannerWidth === '1200x450';
  console.log(`${isWideBanner ? '✅ PASS' : '❌ FAIL'}: Web banner rendered with wide landscape dimensions (1200x450) [Actual: ${webBannerWidth}]`);

  const conceptA0 = results[0].variants[0].concept;
  const conceptB0 = results[1].variants[0].concept;
  const conceptC0 = results[2].variants[0].concept;
  const distinctConcepts = conceptA0 !== conceptB0 && conceptB0 !== conceptC0;
  console.log(`${distinctConcepts ? '✅ PASS' : '❌ FAIL'}: Brief variations (A vs B vs C) produced distinct creative concepts.`);

  if (isWideBanner && distinctConcepts) {
    console.log('\n🎉 ALL MATRIX TESTS COMPLETED & PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME MATRIX CHECKS FAILED');
    process.exit(1);
  }
}

runMatrixTest().catch((err) => {
  console.error('Error during matrix test execution:', err);
  process.exit(1);
});
