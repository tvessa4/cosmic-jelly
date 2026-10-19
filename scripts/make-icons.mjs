// Генератор иконки, заставки и favicon в стиле игры (Глип на космическом фоне).
// Запуск (macOS): node scripts/make-icons.mjs
// Скрипт пишет SVG в assets/brand/ и превращает их в PNG встроенной утилитой macOS qlmanage.

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const brand = fileURLToPath(new URL('../assets/brand/', import.meta.url));
const assets = fileURLToPath(new URL('../assets/', import.meta.url));
mkdirSync(brand, { recursive: true });

/** Звёзды по фиксированному сиду — картинка всегда одинаковая. */
function stars(count, w, h, seed = 7) {
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = (r() * w).toFixed(1);
    const y = (r() * h).toFixed(1);
    const rad = (0.8 + r() * 2.4).toFixed(2);
    const op = (0.35 + r() * 0.65).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${rad}" fill="#fff" opacity="${op}"/>`;
  }
  return out;
}

/** Глип (радостный) в системе координат 100×100. */
const glip = `
  <defs>
    <linearGradient id="glipBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a6ffe6"/><stop offset="0.55" stop-color="#4fe8c4"/><stop offset="1" stop-color="#1fb39a"/>
    </linearGradient>
  </defs>
  <path d="M43 27 Q39 15 31 11" stroke="#2bc9a9" stroke-width="3.4" stroke-linecap="round" fill="none"/>
  <path d="M57 27 Q61 15 69 11" stroke="#2bc9a9" stroke-width="3.4" stroke-linecap="round" fill="none"/>
  <circle cx="31" cy="11" r="7" fill="#ff7ad9" opacity="0.3"/><circle cx="69" cy="11" r="7" fill="#ff7ad9" opacity="0.3"/>
  <circle cx="31" cy="11" r="4.2" fill="#ff7ad9"/><circle cx="69" cy="11" r="4.2" fill="#ff7ad9"/>
  <path d="M20 82 C12 82 10 72 16 66 C14 42 30 24 50 24 C70 24 86 42 84 66 C90 72 88 82 80 82 Q74 88 67 82 Q59 90 51 82 Q43 89 35 82 Q27 88 20 82 Z"
        fill="url(#glipBody)" stroke="#18a089" stroke-width="1.5"/>
  <g opacity="0.6"><ellipse cx="34" cy="40" rx="9" ry="4.5" fill="#fff" transform="rotate(-25 34 40)"/><circle cx="46" cy="34" r="2.2" fill="#fff"/></g>
  <ellipse cx="30" cy="63" rx="5" ry="3" fill="#ff7ad9" opacity="0.55"/><ellipse cx="70" cy="63" rx="5" ry="3" fill="#ff7ad9" opacity="0.55"/>
  <path d="M34 55 Q40 46 46 55" stroke="#1d0b3a" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  <path d="M54 55 Q60 46 66 55" stroke="#1d0b3a" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  <path d="M41 64 Q50 77 59 64 Z" fill="#1d0b3a" stroke="#1d0b3a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M45.5 69.5 Q50 73.5 54.5 69.5 Q50 67.5 45.5 69.5 Z" fill="#ff7aa8"/>`;

function sky(w, h) {
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0d0520"/><stop offset="0.5" stop-color="#1f0d42"/><stop offset="1" stop-color="#38195f"/>
    </linearGradient>
    <radialGradient id="nebP" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff6fd8" stop-opacity="0.45"/><stop offset="1" stop-color="#ff6fd8" stop-opacity="0"/></radialGradient>
    <radialGradient id="nebT" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#3ff0d0" stop-opacity="0.35"/><stop offset="1" stop-color="#3ff0d0" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#5ef2c8" stop-opacity="0.55"/><stop offset="1" stop-color="#5ef2c8" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <ellipse cx="${w * 0.15}" cy="${h * 0.2}" rx="${w * 0.55}" ry="${h * 0.3}" fill="url(#nebP)"/>
  <ellipse cx="${w * 0.9}" cy="${h * 0.85}" rx="${w * 0.55}" ry="${h * 0.3}" fill="url(#nebT)"/>
  ${stars(Math.round((w * h) / 9000), w, h)}`;
}

/** Иконка 1024×1024: Глип с ореолом на звёздном небе (без прозрачности — так требует iOS). */
function icon(size) {
  const g = size * 0.78;
  const off = (size - g) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${sky(size, size)}
  <circle cx="${size / 2}" cy="${size * 0.55}" r="${size * 0.42}" fill="url(#halo)"/>
  <g transform="translate(${off} ${off + size * 0.03}) scale(${g / 100})">${glip}</g>
</svg>`;
}

/** Картинка для заставки: Глип и название (фон заставки задаётся цветом в app.json). */
function splash() {
  const w = 1242;
  const h = 1242;
  const g = 560;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#0d0520"/>
  <defs><radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#5ef2c8" stop-opacity="0.45"/><stop offset="1" stop-color="#5ef2c8" stop-opacity="0"/></radialGradient></defs>
  <circle cx="${w / 2}" cy="${h * 0.42}" r="380" fill="url(#halo)"/>
  <g transform="translate(${(w - g) / 2} ${h * 0.42 - g / 2}) scale(${g / 100})">${glip}</g>
  <text x="${w / 2}" y="${h * 0.86}" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="bold" font-size="120" fill="#ffffff">Cosmic Jelly</text>
</svg>`;
}

function render(name, svg, px) {
  const svgPath = `${brand}${name}.svg`;
  writeFileSync(svgPath, svg);
  execFileSync('qlmanage', ['-t', '-s', String(px), '-o', brand, svgPath], { stdio: 'ignore' });
  const png = `${brand}${name}.svg.png`;
  copyFileSync(png, `${brand}${name}.png`);
  rmSync(png);
  return `${brand}${name}.png`;
}

copyFileSync(render('icon', icon(1024), 1024), `${assets}icon.png`);
copyFileSync(render('splash', splash(), 1242), `${assets}splash-icon.png`);
copyFileSync(render('favicon', icon(256), 256), `${assets}favicon.png`);
console.log('Готово: assets/icon.png, assets/splash-icon.png, assets/favicon.png');
