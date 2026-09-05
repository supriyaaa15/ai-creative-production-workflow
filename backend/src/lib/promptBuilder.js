// The Creative Brief isn't decorative metadata — it's compiled into the
// actual generation prompt here. This is the one function that makes
// output feel "directed" instead of generic, so keep it close to the
// generate node rather than burying it in the frontend.
export function buildVariantPrompt(brief, nodeConfig, variantIndex) {
  const base = nodeConfig?.promptTemplate?.trim();

  const styleHint = brief.style ? `${brief.style} style` : 'clean, professional style';
  const platformHint = brief.platform ? `optimized for ${brief.platform}` : '';
  const audienceHint = brief.audience ? `appealing to ${brief.audience}` : '';
  const goalHint = brief.goal ? `in service of: ${brief.goal}` : '';

  const parts = [
    base || 'Reimagine this product photo with a fresh background and composition',
    styleHint,
    platformHint,
    audienceHint,
    goalHint,
    `(variant ${variantIndex + 1})`,
  ].filter(Boolean);

  return parts.join(', ');
}

export function buildCaptionInstruction(brief, nodeConfig) {
  const tone = nodeConfig?.tone || 'marketing';
  return `Write a short ${tone} caption (max 20 words) for this image. ` +
    `Goal: ${brief.goal || 'promote the product'}. Audience: ${brief.audience || 'general'}. ` +
    `Platform: ${brief.platform || 'social media'}.`;
}
