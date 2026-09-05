import fetch from 'node-fetch';
import sharp from 'sharp';
import fs from 'fs';
import { saveOutputBuffer } from './storage.js';

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const UPSCALE_MODEL_VERSION = process.env.REPLICATE_UPSCALE_MODEL_VERSION ||
  'nightmareai/real-esrgan';

async function callReplicateUpscale(imageUrl, scale) {
  const createRes = await fetch('https://api.replicate.com/v1/models/' + UPSCALE_MODEL_VERSION + '/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({ input: { image: imageUrl, scale } }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Replicate upscale failed: ${createRes.status} ${text}`);
  }
  const prediction = await createRes.json();
  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!outputUrl) throw new Error('Replicate upscale returned no output');
  const imgRes = await fetch(outputUrl);
  return Buffer.from(await imgRes.arrayBuffer());
}

// Demo fallback: a real resize (not true super-resolution, but functionally
// exercises the whole pipeline step for free) so the demo doesn't depend on
// paid APIs to run end to end.
async function demoUpscale(localPath, scale) {
  try {
    const meta = await sharp(localPath).metadata();
    const width = meta.width || 400;
    const height = meta.height || 400;
    return sharp(localPath)
      .resize(Math.round(width * scale), Math.round(height * scale), { kernel: 'lanczos3' })
      .png()
      .toBuffer();
  } catch (err) {
    console.warn(`[demoUpscale] Sharp could not decode image for upscale (${err.message}), using fallback.`);
    return sharp({
      create: { width: 800, height: 800, channels: 4, background: { r: 40, g: 44, b: 52, alpha: 1 } }
    }).png().toBuffer();
  }
}

export async function upscaleImage({ imageUrl, localPath, nodeConfig }) {
  const scale = nodeConfig?.scale || 2;
  let buffer;
  if (REPLICATE_TOKEN) {
    buffer = await callReplicateUpscale(imageUrl, scale);
  } else {
    buffer = await demoUpscale(localPath, scale);
  }
  const saved = saveOutputBuffer(buffer, 'png');
  return { url: saved.url, localPath: saved.localPath };
}
