import express from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';

export const pipelinesRouter = express.Router();

// The fixed 4-node shape. Users configure and enable/disable nodes; they
// don't add/remove/rewire nodes in v1.
export function defaultGraph() {
  return {
    nodes: [
      { id: 'input', type: 'input', enabled: true, config: {} },
      { id: 'generate', type: 'generate', enabled: true, config: { promptTemplate: '' } },
      { id: 'upscale', type: 'upscale', enabled: true, config: { scale: 2 } },
      { id: 'caption', type: 'caption', enabled: true, config: { tone: 'marketing' } },
      { id: 'export', type: 'export', enabled: true, config: { namingPattern: '{original_filename}_v{variant_index}' } },
    ],
    edges: [
      { source: 'input', target: 'generate' },
      { source: 'generate', target: 'upscale' },
      { source: 'upscale', target: 'caption' },
      { source: 'caption', target: 'export' },
    ],
  };
}

pipelinesRouter.post('/', (req, res) => {
  const id = uuid();
  const graph = req.body?.graph_json || defaultGraph();
  db.prepare('INSERT INTO pipelines (id, graph_json) VALUES (?, ?)').run(id, JSON.stringify(graph));
  res.json({ id, graph_json: graph });
});

pipelinesRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM pipelines WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json({ id: row.id, graph_json: JSON.parse(row.graph_json) });
});

pipelinesRouter.put('/:id', (req, res) => {
  const { graph_json } = req.body;
  const result = db.prepare('UPDATE pipelines SET graph_json = ? WHERE id = ?')
    .run(JSON.stringify(graph_json), req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ id: req.params.id, graph_json });
});
