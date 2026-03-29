/**
 * Watches the extension directory. When files change, reloads the extension via
 * Chrome DevTools Protocol (recommended) so the side panel updates immediately.
 *
 * Start Chrome or Edge with --remote-debugging-port=9222, or use npm run dev / npm run dev:edge.
 *
 * Optional: set CHROME_DEBUG_PORT (default 9222).
 *
 * If CDP is unavailable, the in-extension dev-hot-reload.js poller still runs
 * (fixed file listing); CDP is more reliable on Windows.
 */

const path = require('path');
const http = require('http');
const chokidar = require('chokidar');
const WebSocket = require('ws');

const extRoot = path.join(__dirname, '..', 'extension');
const debugPort = process.env.CHROME_DEBUG_PORT || '9222';

let cdpTipShown = false;
let reloadTimer = null;

/**
 * Finds this extension's MV3 service worker and calls chrome.runtime.reload() over CDP.
 * @param {string} port
 * @returns {Promise<boolean>}
 */
function reloadExtensionViaCDP(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const sw = list.find(
            (t) =>
              t.type === 'service_worker' &&
              t.url &&
              /chrome-extension:\/\/[^/]+\/background\.js$/.test(t.url)
          );
          if (!sw || !sw.webSocketDebuggerUrl) {
            resolve(false);
            return;
          }
          const ws = new WebSocket(sw.webSocketDebuggerUrl);
          ws.on('open', () => {
            ws.send(
              JSON.stringify({
                id: 1,
                method: 'Runtime.evaluate',
                params: { expression: 'chrome.runtime.reload()', awaitPromise: false },
              })
            );
            setTimeout(() => {
              try {
                ws.close();
              } catch (_) {
                /* ignore */
              }
              resolve(true);
            }, 300);
          });
          ws.on('error', () => resolve(false));
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
  });
}

function scheduleReload() {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(async () => {
    reloadTimer = null;
    const ok = await reloadExtensionViaCDP(debugPort);
    if (ok) {
      console.log(`[dev] extension reload triggered via DevTools Protocol (port ${debugPort})`);
    } else if (!cdpTipShown) {
      cdpTipShown = true;
      console.log(
        `[dev] No debugger on port ${debugPort} — run  npm run dev  or  npm run dev:edge  (or add --remote-debugging-port=${debugPort} to the browser).`
      );
      console.log('[dev] In-extension file polling still applies for unpacked loads (development).');
    }
  }, 350);
}

console.log('');
console.log('Tab Manager dev watch');
console.log('  • Watching:', extRoot);
console.log(`  • CDP reload: http://127.0.0.1:${debugPort} (set CHROME_DEBUG_PORT to change)`);
console.log('  • For instant reload: use  npm run dev  (Chrome) or  npm run dev:edge  (Microsoft Edge)');
console.log('');

const watcher = chokidar.watch(extRoot, {
  ignored: [/(^|[\\/])\../, '**/node_modules/**'],
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
});

const rel = (p) => path.relative(extRoot, p) || '.';

function onFsEvent(kind, filePath) {
  console.log(`[dev] ${kind.padEnd(7)} ${rel(filePath)}`);
  scheduleReload();
}

watcher.on('change', (filePath) => onFsEvent('changed', filePath));
watcher.on('add', (filePath) => onFsEvent('added', filePath));
watcher.on('unlink', (filePath) => onFsEvent('removed', filePath));

watcher.on('error', (err) => {
  console.error('[dev] watcher error:', err);
});

watcher.on('ready', async () => {
  console.log('[dev] ready — edit files to reload the extension (Ctrl+C to stop)');
  const cdpOk = await reloadExtensionViaCDP(debugPort);
  if (cdpOk) {
    console.log(`[dev] CDP OK — saves will reload the extension via port ${debugPort}`);
  } else {
    console.log('[dev] CDP not connected — run  npm run dev  or  npm run dev:edge  so the browser exposes the debugger port');
  }
});
