// Reuse the tested extension app and its bundled workers for the static website.
// No server, accounts, API keys, or model weights are required.
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { createHash } from 'node:crypto';
import console from 'node:console';
import { zipSync } from 'fflate';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const web = join(root, 'dist-web');
const release = join(root, 'release');
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(dist, 'manifest.json'), 'utf8'));
if (manifest.version !== version) throw new Error('Build and package versions differ. Run npm run build:web.');

async function archive(directory) {
  const files = {};
  async function walk(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && !entry.name.endsWith('.map')) {
        files[relative(directory, path).replaceAll('\\', '/')] = [new Uint8Array(await readFile(path)), { level: entry.name.endsWith('.zip') ? 0 : 6 }];
      }
    }
  }
  await walk(directory);
  return zipSync(files);
}

await mkdir(release, { recursive: true });
const extensionName = `TermsWatch-v${version}-extension.zip`;
const extension = await archive(dist);
await writeFile(join(release, extensionName), extension);
// This exact, generated build directory is disposable. Never target the source root.
if (web !== join(root, 'dist-web')) throw new Error('Unexpected website output path.');
await rm(web, { recursive: true, force: true });
await cp(dist, web, { recursive: true, filter: (path) => !path.endsWith('.map') });
for (const file of ['manifest.json', 'background.js', 'content.js']) await rm(join(web, file), { force: true });
await mkdir(join(web, 'downloads'), { recursive: true });
await writeFile(join(web, 'downloads', 'TermsWatch-extension.zip'), extension);
const websiteName = `TermsWatch-v${version}-website.zip`;
const website = await archive(web);
await writeFile(join(release, websiteName), website);
await writeFile(join(release, 'WEB-SHA256SUMS.txt'), [[extensionName, extension], [websiteName, website]].map(([name, bytes]) => `${createHash('sha256').update(bytes).digest('hex')}  ${name}`).join('\n') + '\n');
console.log(`Website ready: ${web}`);
console.log(`Release files: ${extensionName} (${(extension.length / 1048576).toFixed(1)} MB), ${websiteName} (${(website.length / 1048576).toFixed(1)} MB)`);
