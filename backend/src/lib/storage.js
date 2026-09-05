import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const OUTPUTS_DIR = path.join(DATA_DIR, 'outputs');
export const EXPORTS_DIR = path.join(DATA_DIR, 'exports');

for (const dir of [UPLOADS_DIR, OUTPUTS_DIR, EXPORTS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:8787';

// Saves a buffer to the outputs dir and returns a URL servable by the API
// (see server.js static mounts). Swap this module out for a Supabase/S3
// client later without touching call sites elsewhere in the app.
export function saveOutputBuffer(buffer, ext = 'png') {
  const filename = `${uuid()}.${ext}`;
  const filePath = path.join(OUTPUTS_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return {
    url: `${PUBLIC_BASE}/files/outputs/${filename}`,
    localPath: filePath,
  };
}

export function localPathForOutputUrl(url) {
  const filename = url.split('/files/outputs/')[1];
  return path.join(OUTPUTS_DIR, filename);
}

export function localPathForUploadUrl(url) {
  const filename = url.split('/files/uploads/')[1];
  return path.join(UPLOADS_DIR, filename);
}
