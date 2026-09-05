import sharp from 'sharp';

// Escapes special HTML/XML characters for SVG text rendering
function escapeSvgText(text = '') {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Detect which marketing family this direction belongs to, based on concept/name/composition.
 * Returns: 'urban_lifestyle' | 'race_precision' | 'street_culture' | 'generic'
 */
function detectFamily(creativeDir) {
  const check = [
    creativeDir.creative_concept || '',
    creativeDir.headline || '',
    creativeDir.composition || '',
    creativeDir.theme_style || '',
  ].join(' ').toLowerCase();

  if (check.includes('urban') || check.includes('city') || check.includes('commute') || check.includes('repeat') || check.includes('amber') || check.includes('lifestyle')) {
    return 'urban_lifestyle';
  }
  if (check.includes('street') || check.includes('culture') || check.includes('drop') || check.includes('emerald') || check.includes('green')) {
    return 'street_culture';
  }
  if (check.includes('engineer') || check.includes('precision') || check.includes('technical') || check.includes('navy') || check.includes('spec') || check.includes('data')) {
    return 'race_precision';
  }
  // Fall back to theme_style
  if (creativeDir.theme_style === 'vibrant_split' || creativeDir.composition === 'split_left') return 'street_culture';
  if (creativeDir.theme_style === 'dark_luxury' || creativeDir.composition === 'bottom_overlay') return 'race_precision';
  return 'generic';
}

/**
 * Executes rich local creative rendering based on marketing strategy family.
 * Each family gets a meaningfully different visual treatment:
 *  - urban_lifestyle: asymmetric warm split, amber accents, editorial feel
 *  - race_precision: centered technical grid, cold steel palette, spec callouts
 *  - street_culture: hard-edge split screen, high contrast color blocks
 *  - generic: framed editorial poster, dark background
 */
export async function renderCreativeTransformation(inputBuffer, creativeDir = {}, variantIndex = 0, brief = {}) {
  const platform = (brief.platform || creativeDir.platform || '').toLowerCase();

  let width = 800;
  let height = 1000;
  let isWebBanner = false;
  let isPrint = false;
  let isEmail = false;

  if (platform.includes('banner') || platform.includes('web')) {
    width = 1200; height = 450; isWebBanner = true;
  } else if (platform.includes('print') || platform.includes('poster')) {
    width = 800; height = 1100; isPrint = true;
  } else if (platform.includes('email') || platform.includes('newsletter')) {
    width = 600; height = 750; isEmail = true;
  }

  const headline = escapeSvgText(creativeDir.headline || `VARIANT ${variantIndex + 1}`);
  const subheading = escapeSvgText(creativeDir.subheading || 'AI Directed Campaign Variant');
  const badgeText = escapeSvgText(creativeDir.badge_text || 'FEATURED');
  const ctaText = escapeSvgText(creativeDir.CTA || creativeDir.cta || 'EXPLORE NOW');
  const conceptUpper = escapeSvgText((creativeDir.creative_concept || 'AI Visual Direction').toUpperCase());

  const primaryColor = creativeDir.primary_color || '#0f172a';
  const accentColor = creativeDir.accent_color || '#38bdf8';
  const family = detectFamily(creativeDir);
  const composition = creativeDir.composition || 'framed_poster';

  // ── Product image sizing and placement ──────────────────────────────────────
  let targetWidth, targetHeight, imgX, imgY;

  if (isWebBanner) {
    targetWidth = 520; targetHeight = 370; imgX = 630; imgY = 40;
  } else if (isPrint) {
    targetWidth = 560; targetHeight = 520; imgX = 120; imgY = 160;
  } else if (isEmail) {
    targetWidth = 460; targetHeight = 360; imgX = 70; imgY = 120;
  } else {
    // Social formats — vary per family
    if (family === 'urban_lifestyle') {
      // Asymmetric: product left-weighted
      targetWidth = 420; targetHeight = 460;
      imgX = 30; imgY = 150;
    } else if (family === 'race_precision') {
      // Centered precision hero — tighter crop
      targetWidth = 500; targetHeight = 480;
      imgX = 150; imgY = 120;
    } else if (family === 'street_culture') {
      // Large dominant product bridging the split
      targetWidth = 540; targetHeight = 500;
      imgX = 130; imgY = 100;
    } else {
      targetWidth = 540; targetHeight = 500;
      imgX = 130; imgY = 150;
    }
  }

  let baseProduct;
  try {
    baseProduct = await sharp(inputBuffer)
      .resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch (e) {
    baseProduct = await sharp({
      create: { width: targetWidth, height: targetHeight, channels: 4, background: { r: 30, g: 40, b: 55, alpha: 1 } }
    }).png().toBuffer();
  }

  let backgroundSvg = '';

  // ── Non-social layouts ───────────────────────────────────────────────────────
  if (isWebBanner) {
    backgroundSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#07090e"/>
            <stop offset="55%" stop-color="${primaryColor}"/>
            <stop offset="100%" stop-color="#030407"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bannerGrad)"/>
        <rect x="610" y="25" width="550" height="400" fill="#ffffff0b" rx="16" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="0.4"/>
        <circle cx="900" cy="225" r="180" fill="${accentColor}" fill-opacity="0.08"/>
        <rect x="60" y="45" width="${badgeText.length * 9 + 24}" height="28" fill="${accentColor}" rx="14"/>
        <text x="72" y="64" font-size="11" font-family="sans-serif" font-weight="bold" fill="#090d16" letter-spacing="1.2">${badgeText}</text>
        <text x="60" y="115" font-size="12" font-family="sans-serif" font-weight="bold" fill="${accentColor}" letter-spacing="1.5">${conceptUpper}</text>
        <text x="60" y="165" font-size="34" font-family="sans-serif" font-weight="900" fill="#ffffff" letter-spacing="0.5">${headline}</text>
        <text x="60" y="215" font-size="16" font-family="sans-serif" fill="#cbd5e1">${subheading}</text>
        <rect x="60" y="275" width="${ctaText.length * 11 + 36}" height="46" fill="${accentColor}" rx="8"/>
        <text x="${60 + (ctaText.length * 11 + 36) / 2}" y="304" font-size="14" font-family="sans-serif" font-weight="bold" fill="#090d16" text-anchor="middle" letter-spacing="1.2">${ctaText}</text>
      </svg>`;

  } else if (isPrint) {
    backgroundSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${primaryColor}"/>
        <rect x="40" y="40" width="720" height="1020" fill="none" stroke="${accentColor}" stroke-width="3" rx="16"/>
        <rect x="52" y="52" width="696" height="996" fill="#0b0f19" rx="12"/>
        <rect x="80" y="85" width="${badgeText.length * 9 + 24}" height="28" fill="${accentColor}" rx="14"/>
        <text x="92" y="104" font-size="12" font-family="sans-serif" font-weight="bold" fill="#0f172a" letter-spacing="1.2">${badgeText}</text>
        <text x="80" y="770" font-size="12" font-family="sans-serif" font-weight="bold" fill="${accentColor}" letter-spacing="2">${conceptUpper}</text>
        <text x="80" y="820" font-size="32" font-family="sans-serif" font-weight="900" fill="#ffffff">${headline}</text>
        <text x="80" y="865" font-size="17" font-family="sans-serif" fill="#94a3b8">${subheading}</text>
        <rect x="80" y="915" width="${ctaText.length * 11 + 36}" height="44" fill="${accentColor}" rx="8"/>
        <text x="${80 + (ctaText.length * 11 + 36) / 2}" y="942" font-size="13" font-family="sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="1.2">${ctaText}</text>
      </svg>`;

  } else if (isEmail) {
    backgroundSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${primaryColor}"/>
        <rect x="25" y="25" width="550" height="700" fill="#0f172a" rx="12" stroke="${accentColor}" stroke-width="1.5"/>
        <rect x="45" y="45" width="${badgeText.length * 8 + 20}" height="24" fill="${accentColor}" rx="12"/>
        <text x="55" y="61" font-size="10" font-family="sans-serif" font-weight="bold" fill="#0f172a" letter-spacing="1">${badgeText}</text>
        <text x="45" y="515" font-size="11" font-family="sans-serif" font-weight="bold" fill="${accentColor}" letter-spacing="1.5">${conceptUpper}</text>
        <text x="45" y="550" font-size="24" font-family="sans-serif" font-weight="800" fill="#ffffff">${headline}</text>
        <text x="45" y="585" font-size="14" font-family="sans-serif" fill="#94a3b8">${subheading}</text>
        <rect x="45" y="620" width="${ctaText.length * 10 + 30}" height="40" fill="${accentColor}" rx="6"/>
        <text x="${45 + (ctaText.length * 10 + 30) / 2}" y="645" font-size="12" font-family="sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="1">${ctaText}</text>
      </svg>`;

  } else {
    // ── INSTAGRAM / SOCIAL — per marketing family ─────────────────────────────

    if (family === 'urban_lifestyle') {
      // URBAN LIFESTYLE: Warm asymmetric split editorial
      // Amber + charcoal. Product left panel, copy right panel at bottom.
      backgroundSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="urbanBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1a0a00"/>
              <stop offset="60%" stop-color="#2d1206"/>
              <stop offset="100%" stop-color="#0a0502"/>
            </linearGradient>
            <linearGradient id="urbanAccent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.7"/>
              <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <!-- Warm dark base -->
          <rect width="${width}" height="${height}" fill="url(#urbanBg)"/>
          <!-- Asymmetric left panel warm tone -->
          <rect x="0" y="0" width="360" height="${height}" fill="${primaryColor}" opacity="0.6"/>
          <!-- Bold right accent stripe -->
          <rect x="360" y="0" width="8" height="${height}" fill="${accentColor}" opacity="0.8"/>
          <!-- Diagonal energy slash -->
          <polygon points="0,${height - 300} 360,${height - 180} 360,${height} 0,${height}" fill="${accentColor}" opacity="0.12"/>
          <!-- Bottom text panel -->
          <rect x="0" y="740" width="${width}" height="260" fill="#000000cc"/>
          <rect x="0" y="740" width="${width}" height="3" fill="${accentColor}" opacity="0.9"/>

          <!-- Badge top-left -->
          <rect x="30" y="40" width="${badgeText.length * 9 + 20}" height="26" fill="${accentColor}" rx="4"/>
          <text x="40" y="57" font-size="11" font-family="sans-serif" font-weight="bold" fill="#1a0a00" letter-spacing="1.5">${badgeText}</text>

          <!-- Concept label -->
          <text x="30" y="770" font-size="10" font-family="sans-serif" font-weight="bold" fill="${accentColor}" letter-spacing="2.5">${conceptUpper}</text>

          <!-- Main headline — bold and large -->
          <text x="30" y="815" font-size="32" font-family="sans-serif" font-weight="900" fill="#ffffff" letter-spacing="1">${headline}</text>

          <!-- Subheading -->
          <text x="30" y="850" font-size="14" font-family="sans-serif" fill="#d1a06a">${subheading}</text>

          <!-- CTA — amber block button -->
          <rect x="30" y="878" width="${ctaText.length * 11 + 36}" height="44" fill="${accentColor}" rx="6"/>
          <text x="${30 + (ctaText.length * 11 + 36) / 2}" y="905" font-size="13" font-family="sans-serif" font-weight="bold" fill="#1a0a00" text-anchor="middle" letter-spacing="2">${ctaText}</text>
        </svg>`;

    } else if (family === 'race_precision') {
      // RACE PRECISION: Cold steel navy, centered technical grid layout
      backgroundSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="raceBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#050c1a"/>
              <stop offset="50%" stop-color="${primaryColor}"/>
              <stop offset="100%" stop-color="#020507"/>
            </linearGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#raceBg)"/>

          <!-- Technical grid pattern — horizontal lines at 60px intervals -->
          <line x1="0" y1="100" x2="${width}" y2="100" stroke="${accentColor}" stroke-width="0.4" opacity="0.2"/>
          <line x1="0" y1="160" x2="${width}" y2="160" stroke="${accentColor}" stroke-width="0.4" opacity="0.2"/>
          <line x1="0" y1="220" x2="${width}" y2="220" stroke="${accentColor}" stroke-width="0.4" opacity="0.15"/>
          <line x1="0" y1="650" x2="${width}" y2="650" stroke="${accentColor}" stroke-width="0.4" opacity="0.2"/>
          <line x1="0" y1="710" x2="${width}" y2="710" stroke="${accentColor}" stroke-width="0.4" opacity="0.15"/>
          <!-- Vertical grid lines -->
          <line x1="200" y1="0" x2="200" y2="${height}" stroke="${accentColor}" stroke-width="0.4" opacity="0.1"/>
          <line x1="600" y1="0" x2="600" y2="${height}" stroke="${accentColor}" stroke-width="0.4" opacity="0.1"/>

          <!-- Precision frame -->
          <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.4" rx="4"/>
          <rect x="60" y="60" width="${width - 120}" height="${height - 120}" fill="none" stroke="${accentColor}" stroke-width="0.5" opacity="0.2" rx="2"/>

          <!-- Solo accent glow at bottom center -->
          <ellipse cx="${width / 2}" cy="${height - 80}" rx="320" ry="40" fill="${accentColor}" opacity="0.07"/>

          <!-- Badge — technical label style -->
          <rect x="50" y="55" width="${badgeText.length * 8 + 20}" height="22" fill="none" stroke="${accentColor}" stroke-width="1.5" rx="3"/>
          <text x="60" y="70" font-size="10" font-family="monospace" font-weight="bold" fill="${accentColor}" letter-spacing="2">${badgeText}</text>

          <!-- Spec callout markers -->
          <text x="50" y="680" font-size="9" font-family="monospace" fill="${accentColor}" opacity="0.7" letter-spacing="1">SYS: ACTIVE  |  PERF: MAX  |  WEIGHT: OPTIMIZED</text>

          <!-- Concept label -->
          <text x="50" y="720" font-size="10" font-family="monospace" font-weight="bold" fill="${accentColor}" letter-spacing="2">${conceptUpper}</text>

          <!-- Headline — clean, authoritative -->
          <text x="50" y="768" font-size="30" font-family="sans-serif" font-weight="900" fill="#ffffff" letter-spacing="2">${headline}</text>

          <!-- Subheading -->
          <text x="50" y="800" font-size="14" font-family="monospace" fill="#7095b8">${subheading}</text>

          <!-- CTA — outlined button -->
          <rect x="50" y="832" width="${ctaText.length * 11 + 36}" height="42" fill="${accentColor}" rx="4"/>
          <text x="${50 + (ctaText.length * 11 + 36) / 2}" y="858" font-size="12" font-family="monospace" font-weight="bold" fill="#050c1a" text-anchor="middle" letter-spacing="2">${ctaText}</text>
        </svg>`;

    } else if (family === 'street_culture') {
      // STREET CULTURE: Hard-edge split. No gradients. Pure color blocks.
      backgroundSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Hard split — top 55% dark, bottom 45% accent -->
          <rect x="0" y="0" width="${width}" height="550" fill="${primaryColor}"/>
          <rect x="0" y="550" width="${width}" height="450" fill="${accentColor}"/>

          <!-- Hard horizontal rule at split -->
          <rect x="0" y="547" width="${width}" height="6" fill="#000000"/>

          <!-- Badge top-left — white block -->
          <rect x="40" y="40" width="${badgeText.length * 9 + 24}" height="30" fill="#ffffff" rx="0"/>
          <text x="52" y="60" font-size="12" font-family="sans-serif" font-weight="900" fill="${primaryColor}" letter-spacing="2">${badgeText}</text>

          <!-- Vertical label on right edge — rotated street tag -->
          <text transform="rotate(-90,${width - 30},300)" x="${width - 30}" y="300" font-size="9" font-family="sans-serif" font-weight="bold" fill="${accentColor}" opacity="0.4" letter-spacing="3">${conceptUpper}</text>

          <!-- Bottom panel text on accent block -->
          <text x="40" y="610" font-size="10" font-family="sans-serif" font-weight="bold" fill="#000000" letter-spacing="3" opacity="0.6">${conceptUpper}</text>
          <text x="40" y="660" font-size="34" font-family="sans-serif" font-weight="900" fill="#000000" letter-spacing="1">${headline}</text>
          <text x="40" y="700" font-size="15" font-family="sans-serif" font-weight="600" fill="#000000cc">${subheading}</text>

          <!-- CTA — full black block on accent -->
          <rect x="40" y="735" width="${ctaText.length * 11 + 40}" height="46" fill="#000000" rx="0"/>
          <text x="${40 + (ctaText.length * 11 + 40) / 2}" y="763" font-size="13" font-family="sans-serif" font-weight="900" fill="${accentColor}" text-anchor="middle" letter-spacing="3">${ctaText}</text>
        </svg>`;

    } else {
      // GENERIC FALLBACK: Dark framed editorial poster
      backgroundSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${width}" height="${height}" fill="${primaryColor}"/>
          <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="#0f172a" rx="16" stroke="${accentColor}" stroke-width="2"/>
          <rect x="70" y="70" width="${badgeText.length * 9 + 20}" height="26" fill="${accentColor}" rx="13"/>
          <text x="80" y="87" font-size="11" font-family="sans-serif" font-weight="bold" fill="#0f172a" letter-spacing="1">${badgeText}</text>
          <text x="70" y="735" font-size="11" font-family="sans-serif" font-weight="bold" fill="${accentColor}" letter-spacing="1.5">${conceptUpper}</text>
          <text x="70" y="775" font-size="28" font-family="sans-serif" font-weight="800" fill="#f8fafc">${headline}</text>
          <text x="70" y="810" font-size="15" font-family="sans-serif" fill="#94a3b8">${subheading}</text>
          <rect x="70" y="845" width="${ctaText.length * 10 + 30}" height="38" fill="${accentColor}" rx="6"/>
          <text x="${70 + (ctaText.length * 10 + 30) / 2}" y="869" font-size="12" font-family="sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="1">${ctaText}</text>
        </svg>`;
    }
  }

  const bgBuffer = Buffer.from(backgroundSvg);

  const output = await sharp(bgBuffer)
    .composite([{ input: baseProduct, top: Math.round(imgY), left: Math.round(imgX) }])
    .png()
    .toBuffer();

  return output;
}
