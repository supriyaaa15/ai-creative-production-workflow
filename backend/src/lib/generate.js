import { saveOutputBuffer } from './storage.js';
import { buildVariantPrompt } from './promptBuilder.js';
import { generateCreativeDirections } from './ollama.js';
import { renderCreativeTransformation } from './creativeTransforms.js';

/**
 * Local Creative Rendering Transformation Pipeline
 * Driven by Local Ollama (qwen2.5:3b) creative direction instructions + local Sharp image composition.
 */
export async function generateVariant({ inputBuffer, inputUrl, brief, nodeConfig, variantIndex, totalVariants = 2, existingDirections = [] }) {
  const prompt = buildVariantPrompt(brief, nodeConfig, variantIndex);

  // 1. Get AI-generated creative direction parameters from Ollama (qwen2.5:3b)
  const creativeDir = await generateCreativeDirections({ brief, variantIndex, totalVariants, existingDirections });

  // 2. Perform rich local creative rendering transformation (layout, backgrounds, typography, frames)
  const buffer = await renderCreativeTransformation(inputBuffer, creativeDir, variantIndex, brief);

  // 3. Save output buffer to local disk
  const saved = saveOutputBuffer(buffer, 'png');

  return {
    url: saved.url,
    localPath: saved.localPath,
    prompt,
    creativeDirection: creativeDir,
    score: creativeDir.score,
    recommendation: creativeDir.recommendation,
  };
}
