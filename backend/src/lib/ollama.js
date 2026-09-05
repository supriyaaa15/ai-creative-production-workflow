import fetch from 'node-fetch';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

// Check if Ollama is running and has the target model
export async function checkOllamaStatus() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return { available: false, model: OLLAMA_MODEL, host: OLLAMA_HOST };
    const data = await res.json();
    const hasModel = Array.isArray(data.models) && data.models.some(m => m.name.includes('qwen2.5'));
    return {
      available: true,
      hasModel,
      model: OLLAMA_MODEL,
      host: OLLAMA_HOST,
      models: data.models?.map(m => m.name) || [],
    };
  } catch (err) {
    return { available: false, model: OLLAMA_MODEL, host: OLLAMA_HOST, error: err.message };
  }
}

/**
 * AI Creative Director Proposal Stage
 * Generates 3 genuinely distinct creative directions based on DIFFERENT MARKETING STRATEGIES.
 */
export async function proposeCreativeDirections(brief = {}) {
  const status = await checkOllamaStatus();
  if (!status.available) {
    console.log('[Ollama Creative Director] Ollama offline. Returning 3 rule engine fallback directions.');
    return {
      directions: getFallbackProposals(brief),
      source: 'local_rule_engine',
      ollama_available: false,
    };
  }

  const goalStr = brief.goal || 'Product Launch';
  const audStr = brief.audience || 'Target Audience';
  const styleStr = brief.style || 'Bold & vibrant';
  const platformStr = brief.platform || 'Instagram';

  const prompt = `You are an elite AI Creative Director. Generate EXACTLY 3 creative directions for this campaign.

Campaign Brief:
- Goal: "${goalStr}"
- Audience: "${audStr}"
- Style: "${styleStr}"
- Platform: "${platformStr}"

CRITICAL RULES — EACH DIRECTION MUST REPRESENT A DIFFERENT MARKETING STRATEGY:
Direction 1: Focus on lifestyle and identity — who the customer becomes by owning/using this product.
Direction 2: Focus on technical performance/value — what the product does best and key functional benefits.
Direction 3: Focus on cultural relevance/trend — how this product fits into modern culture or lifestyle movements.

These are DIFFERENT MARKETING ANGLES. Not just different layouts.

FORBIDDEN:
- Do NOT use generic terms like "AI Visual Strategy"
- Do NOT repeat the same headline across directions
- Do NOT repeat the same concept across directions
- Do NOT repeat the same CTA across directions
- Do NOT repeat the same caption across directions
- Do NOT output content about shoes, footwear, or running unless explicitly requested in the brief above.

SCORING: Score each independently on a scale of 6.0-10.0:
- audience_fit: how well does this reach ${audStr}?
- goal_fit: how well does this achieve "${goalStr}"?
- platform_fit: how well does this work on ${platformStr}?
- visual_clarity: how clear and striking is the composition?
- differentiation: how different is this from the other two directions?
overall_score = weighted average of the above five sub-scores

Return ONLY valid raw JSON with this exact structure:
{
  "directions": [
    {
      "id": "direction_1",
      "name": "[Strategy 1 Name tailored to product]",
      "concept": "[Strategic concept tailored to ${audStr}]",
      "strategy": "[Detailed strategic positioning explaining how to achieve '${goalStr}']",
      "composition": "Asymmetric lifestyle editorial layout",
      "background": "Vibrant backdrop matching style '${styleStr}'",
      "product_placement": "split_left",
      "headline": "[Punchy 2-5 word headline for strategy 1]",
      "subheading": "[Supporting tagline for ${audStr}]",
      "cta": "[Action CTA phrase]",
      "primary_color": "#1a0a00",
      "accent_color": "#f59e0b",
      "caption": "[15-25 word social caption tailored to ${goalStr} and ${audStr}]",
      "why_it_works": "[Explanation referencing ${audStr} and ${platformStr}]",
      "why_different": "[How this differs from directions 2 and 3]",
      "scoring": {
        "audience_fit": 9.2,
        "goal_fit": 8.8,
        "platform_fit": 9.4,
        "visual_clarity": 8.6,
        "differentiation": 9.0,
        "overall_score": 9.0
      },
      "score": 9.0
    },
    {
      "id": "direction_2",
      "name": "[Strategy 2 Name focused on performance/value]",
      "concept": "[Functional excellence and core product capability]",
      "strategy": "[Positioning focusing on reliability, specs, or utility to achieve '${goalStr}']",
      "composition": "Centered hero layout with bold feature callouts",
      "background": "Modern sleek backdrop matching '${styleStr}'",
      "product_placement": "center",
      "headline": "[Punchy 2-5 word headline for strategy 2]",
      "subheading": "[Supporting tagline focusing on capability]",
      "cta": "[Action CTA phrase]",
      "primary_color": "#0a1428",
      "accent_color": "#38bdf8",
      "caption": "[15-25 word social caption focused on performance/utility for ${audStr}]",
      "why_it_works": "[Explanation referencing performance appeal on ${platformStr}]",
      "why_different": "[How this differs from directions 1 and 3]",
      "scoring": {
        "audience_fit": 8.5,
        "goal_fit": 9.2,
        "platform_fit": 8.0,
        "visual_clarity": 9.0,
        "differentiation": 8.8,
        "overall_score": 8.7
      },
      "score": 8.7
    },
    {
      "id": "direction_3",
      "name": "[Strategy 3 Name focused on culture/trend]",
      "concept": "[Cultural movement or lifestyle statement]",
      "strategy": "[Positioning focusing on social relevance and style to achieve '${goalStr}']",
      "composition": "High-contrast split composition",
      "background": "Bold high-contrast background",
      "product_placement": "center_bridge",
      "headline": "[Punchy 2-5 word headline for strategy 3]",
      "subheading": "[Supporting tagline focusing on style/trend]",
      "cta": "[Action CTA phrase]",
      "primary_color": "#042c1a",
      "accent_color": "#22c55e",
      "caption": "[15-25 word social caption focused on cultural trend for ${audStr}]",
      "why_it_works": "[Explanation referencing visual impact on ${platformStr}]",
      "why_different": "[How this differs from directions 1 and 2]",
      "scoring": {
        "audience_fit": 9.4,
        "goal_fit": 8.5,
        "platform_fit": 9.5,
        "visual_clarity": 8.8,
        "differentiation": 9.2,
        "overall_score": 9.1
      },
      "score": 9.1
    }
  ]
}`;

  console.log('\n==================== PROMPT SUMMARY ====================');
  console.log(`Goal: ${goalStr} | Audience: ${audStr} | Style: ${styleStr} | Platform: ${platformStr}`);
  console.log('========================================================\n');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        format: 'json',
        stream: false,
        options: { temperature: 0.85, top_p: 0.9 },
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.response);

    if (parsed && Array.isArray(parsed.directions) && parsed.directions.length >= 3) {
      const dirs = parsed.directions.slice(0, 3).map((d, idx) => ({
        id: d.id || `direction_${idx + 1}`,
        name: d.name || `Direction ${idx + 1}`,
        concept: d.concept || `Campaign direction ${idx + 1}`,
        strategy: d.strategy || `Strategic approach to achieve ${goalStr}.`,
        composition: d.composition || 'Asymmetric editorial layout',
        background: d.background || `${styleStr} visual background`,
        product_placement: d.product_placement || 'center',
        headline: d.headline || 'ELEVATE YOUR EVERYDAY',
        subheading: d.subheading || `Engineered for ${audStr}.`,
        cta: d.cta || d.CTA || 'EXPLORE NOW',
        primary_color: d.primary_color || (idx === 0 ? '#1a0a00' : idx === 1 ? '#0a1428' : '#042c1a'),
        accent_color: d.accent_color || (idx === 0 ? '#f59e0b' : idx === 1 ? '#38bdf8' : '#22c55e'),
        caption: d.caption || `${goalStr} — designed for ${audStr}.`,
        why_it_works: d.why_it_works || `Designed to maximize engagement for ${audStr} on ${platformStr}.`,
        why_different: d.why_different || '',
        scoring: d.scoring || null,
        score: typeof d.score === 'number' ? d.score : (9.1 - idx * 0.3),
      }));

      const headlines = dirs.map(d => d.headline.toUpperCase());
      const concepts = dirs.map(d => d.concept.toLowerCase().slice(0, 30));
      const headlineUniq = new Set(headlines).size === 3;
      const conceptUniq = new Set(concepts).size >= 2;
      if (headlineUniq && conceptUniq) {
        return {
          directions: dirs,
          source: 'ollama_qwen2.5:3b',
          ollama_available: true,
        };
      }
      console.warn('[Creative Director] Ollama returned non-unique directions — using rule engine.');
    }
  } catch (err) {
    console.warn('[Ollama Creative Director] Failed via Qwen:', err.message);
  }

  return {
    directions: getFallbackProposals(brief),
    source: 'local_rule_engine',
    ollama_available: true,
  };
}

// ─── MARKETING-STRATEGY-FIRST FALLBACK PROPOSALS ─────────────────────────────
export function getFallbackProposals(brief = {}) {
  const goalStr = brief.goal || 'Product Launch';
  const audStr = brief.audience || 'Target Audience';
  const platformStr = brief.platform || 'Instagram';
  const styleStr = brief.style || 'Bold & vibrant';

  return [
    {
      id: 'direction_1',
      name: 'Everyday Lifestyle Identity',
      concept: `Lifestyle integration for ${audStr}`,
      strategy: `Position the campaign around daily lifestyle integration for ${audStr}. Focus on how it seamlessly supports their daily routine to achieve: ${goalStr}.`,
      composition: 'Asymmetric editorial — off-center product hero with left-aligned typography',
      background: 'Warm amber and dark charcoal split color field with subtle contrast',
      product_placement: 'split_left',
      headline: 'BUILT FOR YOUR DAY',
      subheading: `Designed for ${audStr} who demand style and reliability.`,
      cta: 'EXPLORE NOW',
      primary_color: '#1a0a00',
      accent_color: '#f59e0b',
      caption: `Elevate your everyday experience. ${goalStr} — tailored for ${audStr} who value performance.`,
      why_it_works: `The editorial layout and warm palette connect ${goalStr} directly to the daily lifestyle of ${audStr} on ${platformStr}.`,
      why_different: 'Focuses on user identity and lifestyle integration rather than technical specs or cultural trends.',
      scoring: { audience_fit: 9.2, goal_fit: 8.8, platform_fit: 9.4, visual_clarity: 8.6, differentiation: 9.0, overall_score: 9.0 },
      score: 9.0,
    },
    {
      id: 'direction_2',
      name: 'Performance & Reliability',
      concept: 'Core capabilities and technical authority',
      strategy: `Highlight engineering authority, endurance, and key functional features. Target ${audStr} who make informed decisions based on performance to achieve: ${goalStr}.`,
      composition: 'Centered product hero with clean technical lower grid and feature callouts',
      background: 'Deep navy and steel blue field with a subtle technical grid overlay',
      product_placement: 'center',
      headline: 'POWER THAT LASTS',
      subheading: 'Unmatched endurance and capability for your everyday needs.',
      cta: 'SEE SPECS',
      primary_color: '#0a1428',
      accent_color: '#38bdf8',
      caption: `Engineered to deliver. ${goalStr} — built for ${audStr} who require reliability every single day.`,
      why_it_works: `Cold technical aesthetic highlights product confidence and functional capability for ${audStr} on ${platformStr}.`,
      why_different: 'Focuses on performance proof points and technical specs rather than status or subculture.',
      scoring: { audience_fit: 8.2, goal_fit: 9.3, platform_fit: 7.8, visual_clarity: 9.1, differentiation: 8.7, overall_score: 8.6 },
      score: 8.6,
    },
    {
      id: 'direction_3',
      name: 'Modern Culture & Statement',
      concept: 'Cultural relevance and visual impact',
      strategy: `Position the product as an essential statement piece for ${audStr}. Lean into ${styleStr} visuals and modern trend culture to achieve: ${goalStr}.`,
      composition: 'Bold split-screen layout with high-contrast color blocks bridging the product',
      background: 'Deep obsidian black and electric emerald split with hard geometric edges',
      product_placement: 'center_bridge',
      headline: 'THE NEW STANDARD',
      subheading: 'Bold design meets modern performance.',
      cta: 'GET YOURS FIRST',
      primary_color: '#042c1a',
      accent_color: '#22c55e',
      caption: `The future of everyday tech is here. ${goalStr} — designed for ${audStr} who stay ahead.`,
      why_it_works: `High-contrast split field earns maximum thumb-stopping power for ${audStr} on ${platformStr}.`,
      why_different: 'Taps into trend appeal and social currency rather than pure utility or daily lifestyle.',
      scoring: { audience_fit: 9.5, goal_fit: 8.4, platform_fit: 9.6, visual_clarity: 8.9, differentiation: 9.3, overall_score: 9.1 },
      score: 9.1,
    },
  ];
}

/**
 * Generates a structured creative direction for a single variant within the chosen family.
 * Within the family, variants must explore genuinely different copy and layout — not just layout names.
 */
export async function generateCreativeDirections({ brief, variantIndex, totalVariants = 2, existingDirections = [] }) {
  const status = await checkOllamaStatus();
  const selectedDir = typeof brief.selected_direction === 'string'
    ? (() => { try { return JSON.parse(brief.selected_direction); } catch (e) { return null; } })()
    : brief.selected_direction;

  if (!status.available) {
    console.log(`[Ollama] Offline. Using rule engine fallback.`);
    return getFallbackCreativeDirections(brief, variantIndex, selectedDir);
  }

  const goalStr = brief.goal || 'product launch';
  const audStr = brief.audience || 'discerning customers';
  const platformStr = brief.platform || 'social media';

  // Build known-variants context to prevent duplication
  const priorContext = existingDirections.length > 0
    ? `ALREADY GENERATED VARIANTS — DO NOT REPEAT THESE:
${existingDirections.map((d, i) => `  Variant ${i + 1}: headline="${d.headline}", caption="${d.caption?.slice(0, 40)}", composition="${d.composition}"`).join('\n')}`
    : '';

  const layoutVariant = (() => {
    if (totalVariants === 1) return 'Centered hero with full composition.';
    if (variantIndex === 0) return 'Asymmetric left-weighted layout — product left third, text right two-thirds.';
    if (variantIndex === 1) return 'Full-bleed centered hero — product dominant center, text anchored bottom.';
    return 'Close-crop detail shot — tight framing on product detail, minimal text, large CTA.';
  })();

  const familyContext = selectedDir
    ? `CHOSEN CREATIVE DIRECTION FAMILY:
Name: "${selectedDir.name}"
Marketing Angle: "${selectedDir.strategy}"
Core Concept: "${selectedDir.concept}"
Brand Colors: primary="${selectedDir.primary_color}", accent="${selectedDir.accent_color}"
Tone/Positioning: "${selectedDir.headline}" energy and "${selectedDir.cta}" urgency

You are creating Variant ${variantIndex + 1} of ${totalVariants} for this family.
This variant's layout should be: ${layoutVariant}

COPY RULES:
- Write a NEW headline that fits the same marketing angle but with different words than "${selectedDir.headline}"
- Write NEW caption copy (15-25 words) themed to "${selectedDir.concept}" — do NOT repeat prior captions
- Keep colors consistent with the family (primary: ${selectedDir.primary_color}, accent: ${selectedDir.accent_color})`
    : `No direction family selected. Generate a complete standalone creative direction for variant ${variantIndex + 1} of ${totalVariants}.`;

  const prompt = `You are an elite Creative Director. Generate variant ${variantIndex + 1} of ${totalVariants} for an ad campaign.

${familyContext}

${priorContext}

Campaign:
- Goal: "${goalStr}"
- Audience: "${audStr}"
- Platform: "${platformStr}"

Return ONLY valid raw JSON with these exact keys:
{
  "creative_concept": "Specific 3-7 word phrase for this variant e.g. Urban Speed Identity Variant 2",
  "theme_style": "${selectedDir?.product_placement?.includes('split') || variantIndex % 3 === 1 ? 'vibrant_split' : variantIndex % 3 === 2 ? 'dark_luxury' : 'editorial_poster'}",
  "composition": "${variantIndex === 0 ? 'split_left' : variantIndex === 1 ? 'bottom_overlay' : 'framed_poster'}",
  "background": "Descriptive background e.g. warm amber and charcoal split field with grunge texture",
  "product_placement": "${variantIndex === 0 ? 'split_left' : 'center'}",
  "headline": "NEW 3-6 word headline for this variant (different from ${selectedDir?.headline || 'prior variants'})",
  "subheading": "Supporting tagline that matches the marketing angle",
  "badge_text": "SHORT BADGE",
  "CTA": "ACTION PHRASE",
  "primary_color": "${selectedDir?.primary_color || '#0F172A'}",
  "accent_color": "${selectedDir?.accent_color || '#38BDF8'}",
  "why_it_works": "1-2 specific sentences referencing ${audStr} and ${goalStr} and why this variant layout works on ${platformStr}",
  "caption": "Original 15-25 word social caption unique to this variant — must mention the product type and connect to ${audStr} motivation",
  "score": 8.7,
  "recommendation": "Keep"
}`;

  const callOllama = async (promptText) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: promptText,
        format: 'json',
        stream: false,
        options: { temperature: 0.85, top_p: 0.9 },
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
    const data = await res.json();
    return JSON.parse(data.response);
  };

  try {
    const parsed = await callOllama(prompt);
    if (!parsed || typeof parsed !== 'object' || !parsed.headline) {
      throw new Error('Malformed JSON from Qwen');
    }

    const fallback = getFallbackCreativeDirections(brief, variantIndex, selectedDir);
    return {
      creative_concept: parsed.creative_concept || fallback.creative_concept,
      theme_style: parsed.theme_style || fallback.theme_style,
      composition: parsed.composition || fallback.composition,
      background: parsed.background || (selectedDir?.background || fallback.background),
      product_placement: parsed.product_placement || fallback.product_placement,
      headline: parsed.headline || fallback.headline,
      subheading: parsed.subheading || (selectedDir?.subheading || fallback.subheading),
      badge_text: parsed.badge_text || fallback.badge_text,
      CTA: parsed.CTA || parsed.cta || (selectedDir?.cta || fallback.CTA),
      primary_color: parsed.primary_color || (selectedDir?.primary_color || fallback.primary_color),
      accent_color: parsed.accent_color || (selectedDir?.accent_color || fallback.accent_color),
      why_it_works: parsed.why_it_works || fallback.why_it_works,
      caption: parsed.caption || fallback.caption,
      score: typeof parsed.score === 'number' ? parsed.score : fallback.score,
      recommendation: ['Keep', 'Consider', 'Reject'].includes(parsed.recommendation) ? parsed.recommendation : 'Keep',
      source: 'ollama_qwen2.5:3b',
    };
  } catch (err) {
    console.warn('[Ollama] Variant generation fallback:', err.message);
    return getFallbackCreativeDirections(brief, variantIndex, selectedDir);
  }
}

// ─── VARIANT-LEVEL FALLBACK (per variant, uses marketing angle, not layout names) ─────
export function getFallbackCreativeDirections(brief, variantIndex, selectedDir = null) {
  const goalStr = brief.goal || 'Product Launch';
  const audStr = brief.audience || 'Target Audience';
  const platformStr = brief.platform || 'Instagram';

  if (selectedDir) {
    const layouts = [
      {
        theme_style: 'vibrant_split',
        composition: 'split_left',
        product_placement: 'split_left',
        badge_text: 'FEATURED',
      },
      {
        theme_style: 'dark_luxury',
        composition: 'bottom_overlay',
        product_placement: 'center',
        badge_text: 'PRO EDITION',
      },
      {
        theme_style: 'editorial_poster',
        composition: 'framed_poster',
        product_placement: 'center',
        badge_text: 'EXCLUSIVE',
      },
    ];
    const layout = layouts[variantIndex % layouts.length];

    const copyVariants = {
      'lifestyle': [
        {
          headline: selectedDir.headline || 'BUILT FOR YOUR DAY',
          subheading: selectedDir.subheading || `Designed for ${audStr}.`,
          CTA: selectedDir.cta || 'EXPLORE NOW',
          caption: `${goalStr} — tailored for ${audStr} who demand style and performance.`,
          score: 9.0,
        },
        {
          headline: 'ELEVATE YOUR EVERYDAY',
          subheading: 'Seamless integration for your lifestyle.',
          CTA: 'DISCOVER MORE',
          caption: `Upgrade your daily routine. ${goalStr} built for ${audStr} who value quality.`,
          score: 8.7,
        },
        {
          headline: 'DESIGNED FOR LIVING',
          subheading: 'Unmatched performance wherever you go.',
          CTA: 'CLAIM YOURS',
          caption: `Made to move with you. ${goalStr} engineered for ${audStr}.`,
          score: 8.5,
        },
      ],
      'performance': [
        {
          headline: selectedDir.headline || 'POWER THAT LASTS',
          subheading: selectedDir.subheading || 'Built for ultimate reliability.',
          CTA: selectedDir.cta || 'SEE SPECS',
          caption: `Engineered for excellence. ${goalStr} built for ${audStr} who expect the best.`,
          score: 8.8,
        },
        {
          headline: 'UNMATCHED ENDURANCE',
          subheading: 'Performance you can rely on all day long.',
          CTA: 'LEARN MORE',
          caption: `Power through your demands. ${goalStr} designed to keep up with ${audStr}.`,
          score: 8.6,
        },
        {
          headline: 'PRECISION & CAPABILITY',
          subheading: 'Built to exceed expectations.',
          CTA: 'EXPLORE TECH',
          caption: `No compromises. ${goalStr} offering maximum capability for ${audStr}.`,
          score: 8.4,
        },
      ],
      'culture': [
        {
          headline: selectedDir.headline || 'THE NEW STANDARD',
          subheading: selectedDir.subheading || 'Bold design meets modern tech.',
          CTA: selectedDir.cta || 'GET YOURS FIRST',
          caption: `The next generation is here. ${goalStr} — made for ${audStr}.`,
          score: 9.1,
        },
        {
          headline: 'STAND OUT FROM THE CROWD',
          subheading: 'Sleek visual statement for modern users.',
          CTA: 'JOIN THE MOVEMENT',
          caption: `Set the trend. ${goalStr} tailored for ${audStr} who lead the way.`,
          score: 8.8,
        },
        {
          headline: 'ALWAYS CONNECTED',
          subheading: 'Iconic style with powerful capability.',
          CTA: 'ORDER NOW',
          caption: `Never miss a beat. ${goalStr} designed for ${audStr}.`,
          score: 8.6,
        },
      ],
    };

    const nameLower = (selectedDir.name || '').toLowerCase();
    let family = 'performance';
    if (nameLower.includes('lifestyle') || nameLower.includes('everyday') || nameLower.includes('identity') || nameLower.includes('urban')) {
      family = 'lifestyle';
    } else if (nameLower.includes('culture') || nameLower.includes('statement') || nameLower.includes('trend') || nameLower.includes('modern')) {
      family = 'culture';
    }

    const variants = copyVariants[family];
    const copy = variants[variantIndex % variants.length];

    return {
      creative_concept: `${selectedDir.concept || selectedDir.name} — Variant ${variantIndex + 1}`,
      theme_style: layout.theme_style,
      composition: layout.composition,
      background: selectedDir.background || 'Modern dark gradient backdrop with subtle accent lighting',
      product_placement: layout.product_placement,
      headline: copy.headline,
      subheading: copy.subheading,
      badge_text: layout.badge_text,
      CTA: copy.CTA,
      primary_color: selectedDir.primary_color || '#0F172A',
      accent_color: selectedDir.accent_color || '#38BDF8',
      why_it_works: selectedDir.why_it_works || `Designed to maximize engagement for ${audStr} on ${platformStr}.`,
      caption: copy.caption,
      score: copy.score,
      recommendation: 'Keep',
      source: 'local_rule_engine',
    };
  }

  // Standalone fallback when no direction is selected
  const standalone = [
    {
      creative_concept: 'Everyday Lifestyle Identity',
      theme_style: 'vibrant_split',
      composition: 'split_left',
      background: 'Warm amber and charcoal split color field with subtle contrast',
      product_placement: 'split_left',
      headline: 'BUILT FOR YOUR DAY',
      subheading: `Designed for ${audStr} who demand style and reliability.`,
      badge_text: 'FEATURED',
      CTA: 'EXPLORE NOW',
      primary_color: '#1a0a00',
      accent_color: '#f59e0b',
      why_it_works: `Connects ${goalStr} directly to the daily lifestyle of ${audStr} on ${platformStr}.`,
      caption: `Elevate your everyday experience. ${goalStr} — tailored for ${audStr}.`,
      score: 9.0,
      recommendation: 'Keep',
    },
    {
      creative_concept: 'Performance & Reliability',
      theme_style: 'dark_luxury',
      composition: 'bottom_overlay',
      background: 'Deep navy and steel blue field with technical grid overlay',
      product_placement: 'center',
      headline: 'POWER THAT LASTS',
      subheading: 'Unmatched endurance and capability for your everyday needs.',
      badge_text: 'PRO SPEC',
      CTA: 'SEE SPECS',
      primary_color: '#0a1428',
      accent_color: '#38bdf8',
      why_it_works: `Cold technical aesthetic highlights product confidence and functional capability for ${audStr} on ${platformStr}.`,
      caption: `Engineered to deliver. ${goalStr} — built for ${audStr} who require reliability.`,
      score: 8.6,
      recommendation: 'Keep',
    },
  ];

  return {
    ...standalone[variantIndex % standalone.length],
    source: 'local_rule_engine',
  };
}
