import { writeFileSync, mkdirSync } from 'node:fs';
import { P, plate, corners, extinguisher } from './draw.mjs';

const OUT = 'tools/artwork/svg';
mkdirSync(OUT, { recursive: true });

const S = 1200;                       // square product render
const BW = 1600, BH = 1000;           // wide collection banner

const wrap = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;

/* ------------------------------------------------------- non-cylinder units */

function cabinet() {
  return `
  <rect x="330" y="230" width="540" height="700" rx="10" fill="${P.ink}"/>
  <rect x="352" y="252" width="496" height="656" rx="6" fill="${P.groundRaised}"/>
  <rect x="352" y="252" width="496" height="656" rx="6" fill="${P.steel}" opacity="0.18"/>
  <g transform="translate(0,-24) scale(0.60) translate(672,306)">
    ${extinguisher({ classes: 'ABC', medium: 'DRY POWDER', cx: 340, baseY: 900, scale: 1.34 })}
  </g>
  <rect x="352" y="252" width="496" height="656" rx="6" fill="none" stroke="${P.ink}" stroke-width="4" opacity="0.5"/>
  <line x1="352" y1="252" x2="848" y2="908" stroke="${P.white}" stroke-width="26" opacity="0.16"/>
  <rect x="392" y="826" width="376" height="52" fill="${P.wedge}"/>
  <text x="580" y="863" text-anchor="middle" font-family="Anton, Impact, sans-serif"
        font-size="30" fill="${P.cream}" letter-spacing="5">BREAK GLASS</text>`;
}

function blanket() {
  return `
  <rect x="368" y="250" width="464" height="640" rx="14" fill="${P.wedge}"/>
  <rect x="368" y="250" width="464" height="640" rx="14" fill="url(#cyl)"/>
  <rect x="368" y="250" width="464" height="640" rx="14" fill="none" stroke="${P.ink}" stroke-width="4" opacity="0.4"/>
  <text x="600" y="366" text-anchor="middle" font-family="Anton, Impact, sans-serif"
        font-size="76" fill="${P.cream}" letter-spacing="2">FIRE</text>
  <text x="600" y="440" text-anchor="middle" font-family="Anton, Impact, sans-serif"
        font-size="76" fill="${P.cream}" letter-spacing="2">BLANKET</text>
  <rect x="420" y="474" width="360" height="3" fill="${P.cream}" opacity="0.6"/>
  ${[0, 1, 2, 3].map((i) => `
  <rect x="424" y="${516 + i * 46}" width="${300 - i * 24}" height="9" rx="4" fill="${P.cream}" opacity="0.5"/>`).join('')}
  <path d="M470 742 q130 -46 260 0" stroke="${P.cream}" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M470 796 q130 -46 260 0" stroke="${P.cream}" stroke-width="12" fill="none" stroke-linecap="round"/>
  <text x="600" y="864" text-anchor="middle" font-family="Archivo, Helvetica, sans-serif"
        font-weight="700" font-size="22" fill="${P.cream}" opacity="0.85" letter-spacing="3">PULL TABS DOWN</text>`;
}

function detector() {
  return `
  <ellipse cx="600" cy="640" rx="300" ry="86" fill="${P.ink}" opacity="0.1"/>
  <circle cx="600" cy="560" r="286" fill="${P.groundRaised}"/>
  <circle cx="600" cy="560" r="286" fill="url(#cyl)"/>
  <circle cx="600" cy="560" r="286" fill="none" stroke="${P.ink}" stroke-width="4" opacity="0.42"/>
  <circle cx="600" cy="560" r="212" fill="none" stroke="${P.ink}" stroke-width="3" opacity="0.26"/>
  <circle cx="600" cy="560" r="128" fill="${P.ground}"/>
  ${Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<rect x="${600 + Math.cos(a) * 168 - 9}" y="${560 + Math.sin(a) * 168 - 26}"
      width="18" height="52" rx="9" fill="${P.ink}" opacity="0.32"
      transform="rotate(${(i / 12) * 360 + 90} ${600 + Math.cos(a) * 168} ${560 + Math.sin(a) * 168})"/>`;
  }).join('')}
  <circle cx="600" cy="560" r="34" fill="${P.ink}"/>
  <circle cx="686" cy="474" r="17" fill="${P.wedge}"/>
  <text x="600" y="900" text-anchor="middle" font-family="Anton, Impact, sans-serif"
        font-size="34" fill="${P.inkFaint}" letter-spacing="6">SMOKE DETECTOR</text>`;
}

function hoseReel() {
  return `
  <rect x="300" y="250" width="600" height="600" rx="12" fill="none" stroke="${P.ink}" stroke-width="6" opacity="0.35"/>
  <circle cx="600" cy="550" r="250" fill="${P.wedge}"/>
  <circle cx="600" cy="550" r="250" fill="url(#cyl)"/>
  ${[210, 172, 134, 96].map((r, i) => `
  <circle cx="600" cy="550" r="${r}" fill="none" stroke="${P.ink}" stroke-width="14" opacity="${0.16 + i * 0.05}"/>`).join('')}
  <circle cx="600" cy="550" r="62" fill="${P.ink}"/>
  <circle cx="600" cy="550" r="24" fill="${P.brass}"/>
  <path d="M810 620 q120 40 130 190" stroke="${P.ink}" stroke-width="20" fill="none" stroke-linecap="round"/>
  <rect x="912" y="792" width="34" height="82" rx="10" fill="${P.ink}"/>
  <rect x="286" y="512" width="34" height="80" rx="10" fill="${P.ink}"/>
  <text x="600" y="922" text-anchor="middle" font-family="Anton, Impact, sans-serif"
        font-size="32" fill="${P.inkFaint}" letter-spacing="5">FIRST-AID HOSE REEL</text>`;
}

function signage() {
  const tile = (x, y, bg, glyph) => `
  <rect x="${x}" y="${y}" width="232" height="232" rx="8" fill="${bg}"/>
  <rect x="${x}" y="${y}" width="232" height="232" rx="8" fill="none" stroke="${P.ink}" stroke-width="3" opacity="0.3"/>
  ${glyph(x + 116, y + 116)}`;
  const runner = (cx, cy) => `
  <circle cx="${cx - 16}" cy="${cy - 44}" r="16" fill="${P.white}"/>
  <path d="M${cx - 40} ${cy + 46} l24 -52 l30 22 l6 40" stroke="${P.white}" stroke-width="15"
        fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M${cx + 20} ${cy - 20} l34 26" stroke="${P.white}" stroke-width="14" stroke-linecap="round"/>`;
  const flame = (cx, cy) => `
  <path d="M${cx} ${cy - 56} q40 42 40 72 a40 40 0 1 1 -80 0 q0 -30 40 -72z" fill="${P.white}"/>`;
  const arrow = (cx, cy) => `
  <path d="M${cx - 52} ${cy} h84 M${cx + 6} ${cy - 34} l38 34 l-38 34" stroke="${P.white}"
        stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const cross = (cx, cy) => `
  <circle cx="${cx}" cy="${cy}" r="52" fill="none" stroke="${P.white}" stroke-width="14"/>
  <line x1="${cx - 36}" y1="${cy + 36}" x2="${cx + 36}" y2="${cy - 36}" stroke="${P.white}" stroke-width="14"/>`;
  return `
  ${tile(268, 268, '#009639', runner)}
  ${tile(556, 268, P.wedge, flame)}
  ${tile(268, 556, '#009639', arrow)}
  ${tile(556, 556, P.wedge, cross)}
  <text x="600" y="900" text-anchor="middle" font-family="Anton, Impact, sans-serif"
        font-size="30" fill="${P.inkFaint}" letter-spacing="5">PHOTOLUMINESCENT · IS 9457</text>`;
}

function modular() {
  return `
  <rect x="150" y="248" width="900" height="36" rx="6" fill="${P.ink}" opacity="0.5"/>
  <circle cx="600" cy="500" r="228" fill="${P.wedge}"/>
  <circle cx="600" cy="500" r="228" fill="url(#cyl)"/>
  <circle cx="600" cy="500" r="228" fill="none" stroke="${P.ink}" stroke-width="4" opacity="0.4"/>
  <rect x="566" y="282" width="68" height="60" fill="${P.ink}"/>
  <rect x="556" y="700" width="88" height="44" rx="8" fill="${P.ink}"/>
  <rect x="586" y="738" width="28" height="70" rx="8" fill="${P.brass}"/>
  ${[-1, 0, 1].map((k) => `
  <path d="M600 820 q${k * 130} 66 ${k * 190} 140" stroke="${P.wedge}" stroke-width="10"
        fill="none" opacity="0.5" stroke-linecap="round" stroke-dasharray="4 16"/>`).join('')}
  <text x="600" y="972" text-anchor="middle" font-family="Anton, Impact, sans-serif"
        font-size="30" fill="${P.inkFaint}" letter-spacing="5">DISCHARGES AT 68°C</text>`;
}

/* ----------------------------------------------------------- the catalogue */

const PRODUCTS = {
  'sentinel-abc-dry-powder':      () => extinguisher({ classes: 'A B C', medium: 'ABC DRY POWDER', band: P.cream }),
  'sentinel-abc-vehicle-mount':   () => extinguisher({ classes: 'A B C', medium: 'VEHICLE MOUNT', band: P.cream, scale: 1.06, baseY: 990 }),
  'aegis-co2':                    () => extinguisher({ classes: 'B', medium: 'CARBON DIOXIDE', discharge: 'horn', gauge: false, body: '#B4231A' }),
  'aegis-mechanical-foam-afff':   () => extinguisher({ classes: 'A B', medium: 'AFFF FOAM', band: '#E8C547' }),
  'aegis-water-mist':             () => extinguisher({ classes: 'A K', medium: 'WATER MIST', band: '#DCE7F0' }),
  'aegis-water':                  () => extinguisher({ classes: 'A', medium: 'WATER', band: '#2D6E9E' }),
  'vantage-clean-agent':          () => extinguisher({ classes: 'A B C', medium: 'CLEAN AGENT', band: '#1C7A4B' }),
  'culina-wet-chemical':          () => extinguisher({ classes: 'A K', medium: 'WET CHEMICAL', band: '#E1B12C', discharge: 'lance' }),
  'guardian-class-d':             () => extinguisher({ classes: 'D', medium: 'CLASS D POWDER', band: '#5C6B8A', discharge: 'lance' }),
  'sentinel-automatic-modular':   modular,
  'fireoxine-fire-blanket':       blanket,
  'fireoxine-hose-reel':          hoseReel,
  'fireoxine-smoke-detector':     detector,
  'fireoxine-signage-set':        signage,
  'fireoxine-extinguisher-cabinet': cabinet,
};

for (const [slug, draw] of Object.entries(PRODUCTS)) {
  const svg = wrap(S, S, plate(S, S) + corners(S, S) + draw());
  writeFileSync(`${OUT}/product-${slug}.svg`, svg);
}
console.log(`${Object.keys(PRODUCTS).length} product renders`);

/* ------------------------------------------------------ collection banners

   Wide plates for the category grid. The wedge drives in from the left, the
   family stands to the right of it. No lettering: the card already sets the
   collection name directly beneath, and repeating it in the art would just
   be the same words twice at two different sizes. */

function banner(draw) {
  return `
  ${plate(BW, BH, P.ground)}
  <path d="M0 0 H620 L360 ${BH} H0 Z" fill="${P.wedge}" opacity="0.92"/>
  <path d="M0 0 H620 L360 ${BH} H0 Z" fill="url(#tooth)"/>
  ${draw()}
  ${corners(BW, BH, 40, 34)}`;
}

const unit = (opts, tx, ty, sc) =>
  `<g transform="translate(${tx} ${ty}) scale(${sc})">${extinguisher(opts)}</g>`;

const BANNERS = {
  'abc-dry-powder': () =>
    unit({ classes: 'A B C', medium: 'ABC DRY POWDER', band: P.cream }, 420, -40, 0.86) +
    unit({ classes: 'A B C', medium: 'ABC DRY POWDER', band: P.cream, scale: 1.06 }, 1010, 90, 0.62),
  'co2': () =>
    unit({ classes: 'B', medium: 'CARBON DIOXIDE', discharge: 'horn', gauge: false, body: '#B4231A' }, 440, -40, 0.86) +
    unit({ classes: 'B', medium: 'CARBON DIOXIDE', discharge: 'horn', gauge: false, body: '#B4231A' }, 1010, 110, 0.6),
  'mechanical-foam': () =>
    unit({ classes: 'A B', medium: 'AFFF FOAM', band: '#E8C547' }, 420, -40, 0.86) +
    unit({ classes: 'A B', medium: 'AFFF FOAM', band: '#E8C547' }, 1010, 110, 0.6),
  'water-and-mist': () =>
    unit({ classes: 'A', medium: 'WATER', band: '#2D6E9E' }, 420, -40, 0.86) +
    unit({ classes: 'A K', medium: 'WATER MIST', band: '#DCE7F0' }, 1010, 100, 0.64),
  'clean-agent': () =>
    unit({ classes: 'A B C', medium: 'CLEAN AGENT', band: '#1C7A4B' }, 420, -40, 0.86) +
    unit({ classes: 'A B C', medium: 'CLEAN AGENT', band: '#1C7A4B' }, 1010, 110, 0.6),
  'wet-chemical': () =>
    unit({ classes: 'A K', medium: 'WET CHEMICAL', band: '#E1B12C', discharge: 'lance' }, 400, -40, 0.86),
  'automatic-modular': () => `<g transform="translate(560 40) scale(0.86)">${modular()}</g>`,
  'hose-reels-hydrants': () => `<g transform="translate(540 -30) scale(0.92)">${hoseReel()}</g>`,
  'detection-alarm': () => `<g transform="translate(540 -30) scale(0.9)">${detector()}</g>`,
  'signage': () => `<g transform="translate(520 -40) scale(0.94)">${signage()}</g>`,
  'blankets-gear': () => `<g transform="translate(560 -20) scale(0.9)">${blanket()}</g>`,
  'cabinets-accessories': () => `<g transform="translate(540 -30) scale(0.92)">${cabinet()}</g>`,
};

for (const [slug, draw] of Object.entries(BANNERS)) {
  writeFileSync(`${OUT}/banner-${slug}.svg`, wrap(BW, BH, banner(draw)));
}
console.log(`${Object.keys(BANNERS).length} collection banners`);
