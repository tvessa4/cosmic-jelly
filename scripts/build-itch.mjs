// Сборка веб-версии для itch.io.
// itch.io открывает игру из своей случайной папки (например https://html-classic.itch.zone/html/123456/),
// поэтому все пути к файлам должны быть ОТНОСИТЕЛЬНЫМИ («./_expo/…», а не «/_expo/…»).
// Собираем с временным префиксом и заменяем его на «./», затем упаковываем в zip.
//
// Запуск: npm run build:itch  → готовый архив: itch/cosmic-jelly-web.zip

import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MARK = '/__ITCH_BASE__';
const OUT = 'dist-itch';

rmSync(OUT, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${OUT}`, {
  stdio: 'inherit',
  env: { ...process.env, EXPO_BASE_URL: MARK },
});

// Заменяем префикс на относительный путь во всех текстовых файлах сборки.
let changed = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(html|js|css|json|map)$/.test(name)) {
      const text = readFileSync(p, 'utf8');
      if (text.includes(MARK)) {
        writeFileSync(p, text.split(`${MARK}/`).join('./').split(MARK).join('.'));
        changed++;
      }
    }
  }
}
walk(OUT);
console.log(`Пути исправлены в ${changed} файлах`);

mkdirSync('itch', { recursive: true });
rmSync('itch/cosmic-jelly-web.zip', { force: true });
execSync(`cd ${OUT} && zip -qr ../itch/cosmic-jelly-web.zip .`);
console.log('Готово: itch/cosmic-jelly-web.zip — загрузите этот файл на itch.io');
