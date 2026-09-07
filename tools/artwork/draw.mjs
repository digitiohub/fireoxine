/**
 * FireOxine placeholder artwork generator.
 *
 * Draws every product render and collection banner as SVG in the Agit-Train
 * palette, so the catalogue reads as one designed set rather than as fifteen
 * unrelated photographs borrowed from fifteen different rooms.
 *
 * These are explicitly placeholders. They are illustrations, not photographs,
 * and they are meant to be replaced by the client's own product photography
 * through /admin. Being drawn rather than sourced is what lets them be
 * consistent, correctly coloured per extinguishing medium, and free of any
 * other manufacturer's branding.
 */

export const P = {
  ground: '#E2D9C5',
  groundRaised: '#F7F3E9',
  ink: '#14120F',
  inkSoft: '#5C574D',
  inkFaint: '#8A8271',
  wedge: '#CE2A15',
  wedgeDeep: '#A61F0E',
  cream: '#EDE6D6',
  steel: '#9AA0A6',
  brass: '#B08D57',
  white: '#FFFFFF',
};

/** Newsprint tooth + registration corners: the same furniture the
 *  "photograph pending" plate uses, so drawn and pending states are siblings. */
function plate(w, h, bg = P.ground) {
  return `
  <defs>
    <pattern id="tooth" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.8" fill="${P.ink}" opacity="0.07"/>
    </pattern>
    <linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-opacity="0.28" stop-color="${P.ink}"/>
      <stop offset="0.28" stop-opacity="0" stop-color="${P.ink}"/>
      <stop offset="0.72" stop-opacity="0" stop-color="${P.ink}"/>
      <stop offset="1" stop-opacity="0.22" stop-color="${P.ink}"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${P.white}" stop-opacity="0"/>
      <stop offset="0.18" stop-color="${P.white}" stop-opacity="0.38"/>
      <stop offset="0.34" stop-color="${P.white}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect width="${w}" height="${h}" fill="url(#tooth)"/>`;
}

function corners(w, h, m = 46, len = 40) {
  const s = `stroke="${P.ink}" stroke-opacity="0.22" stroke-width="2" fill="none"`;
  return `
  <path d="M${m} ${m + len}V${m}h${len}" ${s}/>
  <path d="M${w - m - len} ${m}h${len}v${len}" ${s}/>
  <path d="M${w - m} ${h - m - len}v${len}h-${len}" ${s}/>
  <path d="M${m + len} ${h - m}h-${len}v-${len}" ${s}/>`;
}

/**
 * A portable extinguisher, drawn to the proportions of a real stored-pressure
 * unit: squat body, shouldered neck, squeeze-grip head, and whatever discharge
 * device the medium actually uses.
 */
export function extinguisher({
  body = P.wedge,
  band = null,
  discharge = 'hose',      // hose | horn | lance | none
  gauge = true,
  classes = 'ABC',
  medium = '',
  cx = 556,
  baseY = 1020,
  scale = 1.34,
} = {}) {
  const w = 250 * scale;
  const h = 560 * scale;
  const x = cx - w / 2;
  const y = baseY - h;
  const r = 26 * scale;

  const neckW = 74 * scale;
  const neckH = 46 * scale;
  const neckX = cx - neckW / 2;
  const neckY = y - neckH;

  let device = '';
  if (discharge === 'horn') {
    // CO2: rigid swivel arm into a flared discharge horn.
    device = `
    <path d="M${cx + 34 * scale} ${neckY + 12 * scale}
             q${74 * scale} ${6 * scale} ${96 * scale} ${94 * scale}"
          stroke="${P.ink}" stroke-width="${15 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${cx + 118 * scale} ${neckY + 96 * scale}
             l${58 * scale} -${26 * scale} l0 ${88 * scale} z"
          fill="${P.ink}"/>
    <circle cx="${cx + 118 * scale}" cy="${neckY + 112 * scale}" r="${10 * scale}" fill="${P.inkSoft}"/>`;
  } else if (discharge === 'lance') {
    // Wet chemical: long applicator lance for a soft spray over hot oil.
    device = `
    <path d="M${cx + 30 * scale} ${neckY + 14 * scale}
             q${70 * scale} ${20 * scale} ${74 * scale} ${150 * scale}"
          stroke="${P.ink}" stroke-width="${13 * scale}" fill="none" stroke-linecap="round"/>
    <rect x="${cx + 92 * scale}" y="${neckY + 156 * scale}" width="${20 * scale}" height="${120 * scale}"
          rx="${8 * scale}" fill="${P.ink}"/>
    <rect x="${cx + 88 * scale}" y="${neckY + 268 * scale}" width="${28 * scale}" height="${20 * scale}"
          rx="${6 * scale}" fill="${P.brass}"/>`;
  } else if (discharge === 'hose') {
    device = `
    <path d="M${cx + 30 * scale} ${neckY + 16 * scale}
             q${86 * scale} ${40 * scale} ${60 * scale} ${150 * scale}
             q-${16 * scale} ${74 * scale} ${26 * scale} ${104 * scale}"
          stroke="${P.ink}" stroke-width="${17 * scale}" fill="none" stroke-linecap="round"/>
    <rect x="${cx + 104 * scale}" y="${neckY + 268 * scale}" width="${34 * scale}" height="${52 * scale}"
          rx="${8 * scale}" fill="${P.ink}"/>`;
  }

  return `
  ${device}
  <!-- body -->
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${body}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#cyl)"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#gloss)"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"
        fill="none" stroke="${P.ink}" stroke-width="${3 * scale}" stroke-opacity="0.55"/>
  <!-- base rim -->
  <rect x="${x - 8 * scale}" y="${baseY - 26 * scale}" width="${w + 16 * scale}" height="${26 * scale}"
        rx="${8 * scale}" fill="${P.ink}" opacity="0.85"/>
  ${band ? `<rect x="${x}" y="${y + 150 * scale}" width="${w}" height="${58 * scale}" fill="${band}" opacity="0.95"/>
            <rect x="${x}" y="${y + 150 * scale}" width="${w}" height="${58 * scale}" fill="url(#cyl)"/>` : ''}
  <!-- label panel -->
  <rect x="${x + 26 * scale}" y="${y + 236 * scale}" width="${w - 52 * scale}" height="${150 * scale}"
        rx="${6 * scale}" fill="${P.cream}" opacity="0.94"/>
  <text x="${cx}" y="${y + 288 * scale}" text-anchor="middle"
        font-family="Anton, Impact, sans-serif" font-size="${44 * scale}" fill="${P.ink}"
        letter-spacing="${4 * scale}">${classes}</text>
  <text x="${cx}" y="${y + 330 * scale}" text-anchor="middle"
        font-family="Archivo, Helvetica, sans-serif" font-weight="700" font-size="${17 * scale}"
        fill="${P.inkSoft}" letter-spacing="${1.6 * scale}">${medium}</text>
  <rect x="${x + 44 * scale}" y="${y + 348 * scale}" width="${w - 88 * scale}" height="${3 * scale}"
        fill="${P.wedge}"/>
  <!-- neck, head, handle -->
  <rect x="${neckX}" y="${neckY}" width="${neckW}" height="${neckH + 12 * scale}"
        rx="${10 * scale}" fill="${P.ink}"/>
  <rect x="${cx - 96 * scale}" y="${neckY - 30 * scale}" width="${180 * scale}" height="${22 * scale}"
        rx="${11 * scale}" fill="${P.ink}"/>
  <rect x="${cx - 78 * scale}" y="${neckY - 62 * scale}" width="${150 * scale}" height="${20 * scale}"
        rx="${10 * scale}" fill="${P.inkSoft}"/>
  <circle cx="${cx - 52 * scale}" cy="${neckY - 20 * scale}" r="${9 * scale}" fill="${P.brass}"/>
  ${gauge ? `
  <circle cx="${cx - 66 * scale}" cy="${neckY + 24 * scale}" r="${30 * scale}" fill="${P.cream}"
          stroke="${P.ink}" stroke-width="${3 * scale}"/>
  <path d="M${cx - 90 * scale} ${neckY + 24 * scale} a${24 * scale} ${24 * scale} 0 0 1 ${48 * scale} 0"
        fill="none" stroke="#1C7A4B" stroke-width="${7 * scale}"/>
  <line x1="${cx - 66 * scale}" y1="${neckY + 24 * scale}"
        x2="${cx - 56 * scale}" y2="${neckY + 4 * scale}"
        stroke="${P.ink}" stroke-width="${4 * scale}" stroke-linecap="round"/>` : ''}`;
}

export { plate, corners };
