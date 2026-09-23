/**
 * Скрипт генерации атласов для Phaser
 * Заглушка для Фазы 1 — создаёт пустые файлы-плейсхолдеры
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const atlasDir = path.join(__dirname, '..', 'public', 'atlas');
// Создаём директорию если не существует
if (!fs.existsSync(atlasDir)) {
    fs.mkdirSync(atlasDir, { recursive: true });
}
// Плейсхолдер для dwarf_base (будет заменён на реальный ассет в Фазе 2+)
const placeholderPng = path.join(atlasDir, 'dwarf_base.png');
const placeholderJson = path.join(atlasDir, 'dwarf_base.json');
// Создаём минимальный PNG 1x1 (base64 decoded)
const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync(placeholderPng, minimalPng);
// Минимальный JSON атласа
const minimalAtlas = {
    frames: {},
    meta: {
        scale: 1,
        size: { w: 1, h: 1 },
    },
};
fs.writeFileSync(placeholderJson, JSON.stringify(minimalAtlas, null, 2));
console.log('✓ Atlas placeholders generated in public/atlas/');
