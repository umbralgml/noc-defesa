// Copia o jogo (raiz do repositório) para www/, que o Capacitor empacota dentro do app.
// Tudo vai junto no APK: o jogo abre e roda sem internet.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..'), raiz = join(app, '..'), www = join(app, 'www');
rmSync(www, { recursive: true, force: true }); mkdirSync(www);
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'og-image.png', 'src']) {
  if (existsSync(join(raiz, f))) cpSync(join(raiz, f), join(www, f), { recursive: true });
}
console.log('jogo copiado para', www);
