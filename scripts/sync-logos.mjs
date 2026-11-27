import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(repoRoot, 'logos');
const targetArg = process.argv[2] || 'all';

const WEB_FILES = [
  'logo.png',
  'logo-eng.png',
  'logo-tam.png',
  'logo-white.png',
  'logo-white-eng.png',
  'logo-white-tam.png',
  'logo-black-monochrome.png',
  'logo-navy-monochrome.png',
  'icon.png',
  'circular-icon.png',
  'favicon.ico',
  'favicon.svg',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'favicon-192x192.png',
  'icon-72.png',
  'icon-96.png',
  'icon-128.png',
  'icon-144.png',
  'icon-152.png',
  'icon-180.png',
  'icon-192.png',
  'icon-256.png',
  'icon-384.png',
  'icon-512.png',
  'icon-192-maskable.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
  'apple-icon-120.png',
  'apple-icon-152.png',
  'apple-icon-167.png',
  'apple-icon-180.png',
  'adaptive-icon-foreground.png',
  'adaptive-icon-background.png',
  'adaptive-icon-monochrome.png'
];

const ADMIN_FILES = [
  'logo.png',
  'logo-white.png',
  'logo-navy-monochrome.png',
  'icon.png',
  'circular-icon.png',
  'favicon.ico',
  'favicon.svg',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'favicon-192x192.png',
  'icon-72.png',
  'icon-96.png',
  'icon-128.png',
  'icon-144.png',
  'icon-152.png',
  'icon-180.png',
  'icon-192.png',
  'icon-256.png',
  'icon-384.png',
  'icon-512.png',
  'icon-192-maskable.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
  'apple-icon-120.png',
  'apple-icon-152.png',
  'apple-icon-167.png',
  'apple-icon-180.png',
  'adaptive-icon-foreground.png',
  'adaptive-icon-background.png',
  'adaptive-icon-monochrome.png'
];

function syncTarget(appName, files) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Missing canonical /logos directory at ${sourceDir}`);
  }
  const destDir = path.join(repoRoot, 'apps', appName, 'public', 'logos');
  fs.mkdirSync(destDir, { recursive: true });

  const allowed = new Set(files);
  for (const existing of fs.readdirSync(destDir)) {
    if (!allowed.has(existing)) {
      fs.rmSync(path.join(destDir, existing), { force: true, recursive: true });
    }
  }

  for (const file of files) {
    const src = path.join(sourceDir, file);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing required logo asset: ${src}`);
    }
    fs.copyFileSync(src, path.join(destDir, file));
  }

  // Also place favicon.ico at app public root so browser default GET /favicon.ico never 404s
  const rootFaviconSrc = path.join(sourceDir, 'favicon.ico');
  if (fs.existsSync(rootFaviconSrc)) {
    fs.copyFileSync(rootFaviconSrc, path.join(repoRoot, 'apps', appName, 'public', 'favicon.ico'));
  }
}

if (targetArg === 'web' || targetArg === 'all') {
  syncTarget('web', WEB_FILES);
}
if (targetArg === 'admin' || targetArg === 'all') {
  syncTarget('admin', ADMIN_FILES);
}
