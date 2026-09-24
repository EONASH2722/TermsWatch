import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import console from 'node:console';
import { zipSync } from 'fflate';

const root = resolve(import.meta.dirname, '..');
const release = join(root, 'release');
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const files = {};
const skipped = new Set(['node_modules', '.git', '.gradle', '.kotlin', 'build', 'dist', 'dist-web', 'release', 'output', 'coverage', 'capacitor-cordova-android-plugins']);

async function add(path) {
  const name = relative(root, path).split(sep).join('/');
  if (name.split('/').some((part) => skipped.has(part))) return;
  if (name === 'apps/android/app/src/main/assets' || name.startsWith('apps/android/app/src/main/assets/')) return;
  const entries = await readdir(path, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOTDIR') return undefined;
    throw error;
  });
  if (entries) {
    for (const entry of entries) await add(join(path, entry.name));
  } else if (!name.endsWith('.log') && !name.endsWith('.map') && !name.endsWith('/local.properties')) {
    files[name] = [new Uint8Array(await readFile(path)), { level: 6 }];
  }
}

for (const name of ['src', 'public', 'scripts', 'docs', 'fixtures', '.github', 'apps/android', '.gitignore', 'LICENSE', 'README.md', 'package.json', 'package-lock.json', 'index.html', 'capacitor.config.ts', 'eslint.config.js', 'postcss.config.js', 'tailwind.config.ts', 'tsconfig.json', 'vite.config.ts']) {
  await add(join(root, name));
}
await mkdir(release, { recursive: true });
const output = join(release, `TermsWatch-v${version}-source.zip`);
await writeFile(output, zipSync(files));
console.log(`Source package ready: ${output} (${Object.keys(files).length} files)`);
