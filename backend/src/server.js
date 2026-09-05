import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { UPLOADS_DIR, OUTPUTS_DIR, EXPORTS_DIR } from './lib/storage.js';
import { pipelinesRouter } from './routes/pipelines.js';
import { uploadsRouter } from './routes/uploads.js';
import { jobsRouter } from './routes/jobs.js';
import { checkOllamaStatus } from './lib/ollama.js';
import './db/index.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/files/uploads', express.static(UPLOADS_DIR));
app.use('/files/outputs', express.static(OUTPUTS_DIR));
app.use('/files/exports', express.static(EXPORTS_DIR));

app.use('/api/pipelines', pipelinesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/jobs', jobsRouter);

app.get('/api/health', async (req, res) => {
  const ollama = await checkOllamaStatus();
  res.json({
    ok: true,
    local_ai: ollama.available,
    ollama,
    mode: ollama.available ? 'local_ai' : 'local_rule_engine',
  });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, async () => {
  console.log(`API listening on http://localhost:${PORT}`);
  const ollama = await checkOllamaStatus();
  if (ollama.available) {
    console.log(`[LOCAL AI] Ollama is active on ${ollama.host} using model '${ollama.model}'. (₹0 / $0 Cost)`);
  } else {
    console.log(`[LOCAL ENGINE] Ollama is offline. Using local rule-based creative engine. (₹0 / $0 Cost)`);
  }
});
