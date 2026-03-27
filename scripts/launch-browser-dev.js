/**
 * Launches Chrome or Microsoft Edge (Chromium) with this repo's unpacked extension
 * and remote debugging so `npm run dev` can reload over CDP.
 *
 * Browser: set BROWSER=edge (or DEV_BROWSER=edge) for Edge; default is Chrome.
 * Paths: CHROME_PATH, EDGE_PATH override auto-detection.
 */

const path = require('path');
const chromeLauncher = require('chrome-launcher');
const { resolveBrowser } = require('./resolve-browser.js');

const extRoot = path.resolve(__dirname, '..', 'extension');
const debugPort = Number(process.env.CHROME_DEBUG_PORT || '9222');

async function main() {
  const { kind, executable, extensionsUrl } = resolveBrowser();
  const launched = await chromeLauncher.launch({
    port: debugPort,
    chromePath: executable,
    chromeFlags: [
      `--disable-extensions-except=${extRoot}`,
      `--load-extension=${extRoot}`,
      '--no-first-run',
      '--disable-default-apps',
      `--remote-debugging-port=${debugPort}`,
    ],
    startingUrl: extensionsUrl,
  });

  const label = kind === 'edge' ? 'Edge' : 'Chrome';
  console.log('');
  console.log(`${label} dev instance started`);
  console.log(`  • Extension: ${extRoot}`);
  console.log(`  • Remote debugging: http://127.0.0.1:${launched.port}`);
  console.log('  • With npm run dev / dev:edge, the watcher runs alongside; Ctrl+C stops both.');
  console.log('');

  const shutdown = () => {
    launched
      .kill()
      .catch(() => {})
      .finally(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await new Promise(() => {});
}

main().catch((err) => {
  if (err && err.code === 'ERR_EDGE_NOT_FOUND') {
    console.error(err.message);
  } else if (err && err.code === 'ERR_CHROME_NOT_FOUND') {
    console.error(err.message);
  } else if (err && err.code === 'ERR_LAUNCHER_NOT_INSTALLED') {
    console.error('Browser was not found. Install Chrome or Edge, or set CHROME_PATH / EDGE_PATH.');
  } else {
    console.error(err);
  }
  process.exit(1);
});
