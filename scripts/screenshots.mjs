// Автоматические скриншоты игры и обложка для itch.io (через Google Chrome без окна).
// Нужен запущенный сайт игры, например: npx serve dist-itch  или  python3 -m http.server --directory dist-itch
// Запуск: node scripts/screenshots.mjs http://localhost:8096/html/123456/index.html
// Результат: docs/screenshots/*.png и itch/cover.png

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const GAME_URL = process.argv[2];
if (!GAME_URL) throw new Error('Укажите адрес игры: node scripts/screenshots.mjs <url>');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync('docs/screenshots', { recursive: true });
mkdirSync('itch', { recursive: true });

// ---------- Красивое демонстрационное состояние ----------
const today = new Date();
const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
let id = 1;
const t = (v) => (v ? { id: id++, value: v } : null);
const grid = [
  [2, 4, 8, 16],
  [256, 128, 64, 32],
  [512, 1024, 2048, 0],
  [0, 0, 4, 2],
].map((row) => row.map(t));
const demoGame = {
  grid,
  score: 24580,
  rngState: 12345,
  nextId: id,
  moves: 912,
  won: true,
  gameOver: false,
  boosters: { undo: 2, hammer: 1, shuffle: 1 },
  previous: null,
};
const demoProfile = {
  version: 1,
  coins: 340,
  bestScore: 24580,
  bestTile: 2048,
  gamesPlayed: 12,
  achievements: ['tile_256', 'tile_512', 'tile_1024', 'tile_2048', 'combo_3', 'daily_first'],
  daily: { lastClaim: day, streak: 4 },
  challenge: { date: day, best: 3120 },
};
const seedScript = `
  localStorage.clear();
  localStorage.setItem('cj.profile.v1', ${JSON.stringify(JSON.stringify(demoProfile))});
  localStorage.setItem('cj.game.classic.v1', ${JSON.stringify(JSON.stringify({ date: day, state: demoGame }))});
  localStorage.setItem('cj.settings.v1', JSON.stringify({ sound: false, music: false, haptics: true }));
`;
const click = (label) => `
  (() => { const el = [...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label').startsWith(${JSON.stringify(label)}));
  if (!el) throw new Error('нет кнопки ${label}'); el.click(); })()`;

// ---------- Обложка 630×500 ----------
const fontUrl = (p) => pathToFileURL(resolve('node_modules/@expo-google-fonts', p)).href;
const coverHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Fredoka; src: url('${fontUrl('fredoka/700Bold/Fredoka_700Bold.ttf')}'); }
@font-face { font-family: Nunito; src: url('${fontUrl('nunito/900Black/Nunito_900Black.ttf')}'); }
html,body { margin:0; width:630px; height:500px; overflow:hidden; }
body { background: radial-gradient(ellipse at 15% 20%, rgba(255,111,216,.35), transparent 55%),
  radial-gradient(ellipse at 90% 90%, rgba(63,240,208,.28), transparent 55%), linear-gradient(#0d0520,#1f0d42 55%,#38195f);
  font-family: Nunito; color: #fff; position: relative; }
.title { position:absolute; left:40px; top:70px; font-size:64px; line-height:1; text-shadow:0 0 22px #ff7ad9; }
.sub { position:absolute; left:44px; top:150px; font-size:22px; color:#c9b8f2; }
.glip { position:absolute; left:40px; bottom:28px; width:230px; }
.tiles { position:absolute; right:36px; top:195px; display:grid; grid-template-columns:repeat(2,118px); gap:14px; transform: rotate(-6deg); }
.tile { height:118px; border-radius:28px; display:flex; align-items:center; justify-content:center; font-family:Fredoka;
  font-size:44px; color:#2a1546; border:2px solid rgba(255,255,255,.45); position:relative; overflow:hidden; }
.tile::before { content:''; position:absolute; top:9px; left:14px; width:60px; height:20px; border-radius:20px; background:rgba(255,255,255,.5); transform:rotate(-6deg); }
.star { position:absolute; width:3px; height:3px; border-radius:3px; background:#fff; }
</style></head><body>
${Array.from({ length: 45 }, (_, i) => `<div class="star" style="left:${(i * 137) % 630}px;top:${(i * 89) % 500}px;opacity:${0.3 + ((i * 7) % 7) / 10}"></div>`).join('')}
<div class="title">Cosmic Jelly</div>
<div class="sub">уютная 2048 в космосе</div>
<svg class="glip" viewBox="0 0 100 100">
  <defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6ffe6"/><stop offset=".55" stop-color="#4fe8c4"/><stop offset="1" stop-color="#1fb39a"/></linearGradient></defs>
  <path d="M43 27 Q39 15 31 11" stroke="#2bc9a9" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M57 27 Q61 15 69 11" stroke="#2bc9a9" stroke-width="3.4" stroke-linecap="round" fill="none"/>
  <circle cx="31" cy="11" r="4.2" fill="#ff7ad9"/><circle cx="69" cy="11" r="4.2" fill="#ff7ad9"/>
  <path d="M20 82 C12 82 10 72 16 66 C14 42 30 24 50 24 C70 24 86 42 84 66 C90 72 88 82 80 82 Q74 88 67 82 Q59 90 51 82 Q43 89 35 82 Q27 88 20 82 Z" fill="url(#b)" stroke="#18a089" stroke-width="1.5"/>
  <ellipse cx="34" cy="40" rx="9" ry="4.5" fill="#fff" opacity=".6" transform="rotate(-25 34 40)"/>
  <ellipse cx="30" cy="63" rx="5" ry="3" fill="#ff7ad9" opacity=".55"/><ellipse cx="70" cy="63" rx="5" ry="3" fill="#ff7ad9" opacity=".55"/>
  <path d="M34 55 Q40 46 46 55" stroke="#1d0b3a" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M54 55 Q60 46 66 55" stroke="#1d0b3a" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  <path d="M41 64 Q50 77 59 64 Z" fill="#1d0b3a"/><path d="M45.5 69.5 Q50 73.5 54.5 69.5 Q50 67.5 45.5 69.5 Z" fill="#ff7aa8"/>
</svg>
<div class="tiles">
  <div class="tile" style="background:linear-gradient(#fff1c2,#ffb02e)">2048</div>
  <div class="tile" style="background:linear-gradient(#ffd0e0,#ff5f8a);font-size:38px">1024</div>
  <div class="tile" style="background:linear-gradient(#ffd6f5,#ff86e0)">512</div>
  <div class="tile" style="background:linear-gradient(#e6d6ff,#c79bff)">256</div>
</div>
</body></html>`;
const tmp = mkdtempSync(join(tmpdir(), 'cj-shots-'));
const coverPath = join(tmp, 'cover.html');
writeFileSync(coverPath, coverHtml);

// ---------- Chrome DevTools Protocol ----------
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(tmp, 'profile')}`,
  '--allow-file-access-from-files',
  '--hide-scrollbars',
  'about:blank',
]);
let ws;
for (let i = 0; i < 40 && !ws; i++) {
  await sleep(250);
  try {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = targets.find((t) => t.type === 'page');
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
  } catch {
    // Chrome ещё запускается
  }
}
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let msgId = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve: ok, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : ok(m.result);
  }
});
const send = (method, params = {}) =>
  new Promise((ok, reject) => {
    const mid = ++msgId;
    pending.set(mid, { resolve: ok, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'ошибка в странице');
  return r.result.value;
};
const shot = async (file) => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(data, 'base64'));
  console.log('✓', file);
};

await send('Page.enable');

// Обложка
await send('Emulation.setDeviceMetricsOverride', {
  width: 630,
  height: 500,
  deviceScaleFactor: 2,
  mobile: false,
});
await send('Page.navigate', { url: pathToFileURL(coverPath).href });
await sleep(1500);
await shot('itch/cover.png');

// Скриншоты игры в размере iPhone
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await send('Page.navigate', { url: GAME_URL });
await sleep(1500);
await evaluate(seedScript);
await send('Page.navigate', { url: GAME_URL });
await sleep(5000);
await shot('docs/screenshots/menu.png');

await evaluate(click('Продолжить'));
await sleep(2000);
await shot('docs/screenshots/game.png');

await evaluate(click('Пауза'));
await sleep(800);
await evaluate(click('В меню'));
await sleep(1500);
await evaluate(click('Достижения'));
await sleep(1500);
await shot('docs/screenshots/achievements.png');

ws.close();
chrome.kill();
console.log('Готово');
process.exit(0);
