import { generateCreativeDirections } from './ollama.js';

// Structured fallback caption builder if AI engine is offline
function demoCaption(brief, variantIndex) {
  const styleWord = brief.style || 'fresh';
  const platformWord = brief.platform ? ` — made for ${brief.platform}` : '';
  return `${styleWord} take on your product, variant ${variantIndex + 1}${platformWord}.`;
}

/**
 * Local AI Caption Generation using Ollama (qwen2.5:3b)
 */
export async function captionImage({ imageUrl, localPath, brief, nodeConfig, variantIndex, creativeDirection }) {
  if (creativeDirection?.caption) {
    return creativeDirection.caption;
  }

  const creative = await generateCreativeDirections({ brief, variantIndex });
  return creative.caption || demoCaption(brief, variantIndex);
}
