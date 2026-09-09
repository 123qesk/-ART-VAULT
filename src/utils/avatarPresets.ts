export interface AvatarPreset {
  id: string;
  name: string;
  tag: string;
  svg: string; // SVG Data URI or raw SVG
}

// Crisp, elegant vector art avatar SVG data URIs for artists
export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'palette',
    name: '灵感调色师',
    tag: '水彩油画',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%23FFF6EA" stroke="%23E4C8A6" stroke-width="3"/><path d="M72 45c0 14-11 25-24 25-5 0-9-2-12-5-4-4-5-8-2-13 2-4 6-6 10-6 3 0 6 2 8 0 2-2 1-6-1-8-3-3-2-8 2-10 6-3 19 3 19 17z" fill="%23E7B27C" opacity="0.9"/><circle cx="36" cy="40" r="5" fill="%23E63946"/><circle cx="48" cy="34" r="5" fill="%23F4A261"/><circle cx="62" cy="40" r="5" fill="%232A9D8F"/><circle cx="62" cy="56" r="5" fill="%23457B9D"/><circle cx="48" cy="62" r="5" fill="%237209B7"/><circle cx="36" cy="54" r="3.5" fill="%23FFF6EA"/></svg>`,
  },
  {
    id: 'cat',
    name: '画室喵星人',
    tag: '萌系灵感',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%23F3EDF7" stroke="%23D0BFDE" stroke-width="3"/><ellipse cx="50" cy="58" rx="26" ry="22" fill="%23E3A06B"/><path d="M28 42L36 26L44 38Z" fill="%23D08650"/><path d="M72 42L64 26L56 38Z" fill="%23D08650"/><ellipse cx="50" cy="38" rx="20" ry="10" fill="%23C84B31" transform="rotate(-6 50 38)"/><circle cx="58" cy="28" r="3.5" fill="%23F6E7D8"/><circle cx="42" cy="56" r="3.5" fill="%23222"/><circle cx="58" cy="56" r="3.5" fill="%23222"/><ellipse cx="50" cy="64" rx="4" ry="2.5" fill="%23F9C5D1"/><line x1="30" y1="62" x2="20" y2="60" stroke="%23777" stroke-width="1.5"/><line x1="30" y1="65" x2="19" y2="66" stroke="%23777" stroke-width="1.5"/><line x1="70" y1="62" x2="80" y2="60" stroke="%23777" stroke-width="1.5"/><line x1="70" y1="65" x2="81" y2="66" stroke="%23777" stroke-width="1.5"/></svg>`,
  },
  {
    id: 'ink',
    name: '水墨禅境',
    tag: '东方工笔',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%23F5F4EE" stroke="%23D3CEBE" stroke-width="3"/><circle cx="68" cy="35" r="16" fill="%23E27D60" opacity="0.85"/><path d="M18 78C30 65 42 62 55 68C68 74 80 66 84 60L84 82C75 84 60 84 45 84C30 84 20 82 18 78Z" fill="%232D3142"/><path d="M30 60C38 52 46 51 54 54C62 57 70 53 74 48" stroke="%234F5D75" stroke-width="3" stroke-linecap="round"/><circle cx="34" cy="32" r="2" fill="%232D3142"/><circle cx="40" cy="28" r="2.5" fill="%232D3142"/><circle cx="47" cy="32" r="1.5" fill="%232D3142"/></svg>`,
  },
  {
    id: 'botanical',
    name: '森系插画师',
    tag: '自然治愈',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%23EFF8F2" stroke="%23C2E2CC" stroke-width="3"/><circle cx="50" cy="46" r="18" fill="%23E07A5F"/><path d="M50 20C40 28 35 40 38 50C42 40 48 30 50 20Z" fill="%233D5A80"/><path d="M50 20C60 28 65 40 62 50C58 40 52 30 50 20Z" fill="%232A9D8F"/><path d="M26 68C34 60 45 62 52 58C60 54 70 56 76 68C74 76 62 82 50 82C38 82 28 76 26 68Z" fill="%232A9D8F"/><circle cx="50" cy="74" r="3" fill="%23F4A261"/></svg>`,
  },
  {
    id: 'cyber',
    name: '概念光影师',
    tag: '数字板绘',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%23111322" stroke="%233A3F68" stroke-width="3"/><circle cx="50" cy="50" r="32" stroke="%236366F1" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M50 24L56 42L74 44L60 56L65 74L50 63L35 74L40 56L26 44L44 42Z" fill="%23EC4899" opacity="0.85"/><circle cx="50" cy="50" r="8" fill="%23FDE047"/></svg>`,
  },
  {
    id: 'classic',
    name: '古典画师',
    tag: '印象油画',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%23F8F5EE" stroke="%23DECBA4" stroke-width="3"/><rect x="28" y="24" width="44" height="52" rx="4" fill="%23BC6C25" stroke="%238C4A15" stroke-width="2.5"/><rect x="34" y="30" width="32" height="40" rx="2" fill="%23DDA15E"/><circle cx="44" cy="44" r="6" fill="%23E76F51"/><path d="M34 62L44 52L54 58L66 48L66 70L34 70Z" fill="%23283618"/></svg>`,
  },
];

export const DEFAULT_AVATAR = AVATAR_PRESETS[0].svg;
