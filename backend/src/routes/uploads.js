import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { UPLOADS_DIR } from '../lib/storage.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});

// Demo-scale safety: cap batch size and per-file size so a well-meaning
// "let me try 200 photos" doesn't blow the demo budget or timeline.
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 20 },
});

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:8787';

export const uploadsRouter = express.Router();

uploadsRouter.post('/', upload.array('files'), (req, res) => {
  const files = (req.files || []).map(f => ({
    filename: f.originalname,
    storage_url: `${PUBLIC_BASE}/files/uploads/${f.filename}`,
  }));
  res.json({ files });
});
