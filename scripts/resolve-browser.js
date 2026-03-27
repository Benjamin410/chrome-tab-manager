const fs = require('fs');
const os = require('os');
const chromeLauncher = require('chrome-launcher');

/**
 * @typedef {{ kind: 'chrome' | 'edge', executable: string, extensionsUrl: string }} ResolvedBrowser
 */

/**
 * Returns candidate paths for Microsoft Edge (Chromium).
 * @returns {string[]}
 */
function getEdgeCandidates() {
  const env = process.env.EDGE_PATH;
  const list = [];
  if (env) list.push(env);
  const platform = os.platform();
  if (platform === 'win32') {
    list.push(
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    );
  } else if (platform === 'darwin') {
    list.push('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    list.push(
      '/usr/bin/microsoft-edge',
      '/usr/bin/microsoft-edge-stable',
      '/opt/microsoft/msedge/msedge'
    );
  }
  return [...new Set(list)];
}

/**
 * Resolves the Edge executable path, or null if not found.
 * @returns {string | null}
 */
function resolveEdgePath() {
  for (const candidate of getEdgeCandidates()) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Chooses Chrome or Edge from BROWSER / DEV_BROWSER (default: chrome).
 * @returns {ResolvedBrowser}
 */
function resolveBrowser() {
  const raw = (process.env.BROWSER || process.env.DEV_BROWSER || 'chrome').toLowerCase();
  if (raw === 'edge' || raw === 'msedge') {
    const executable = resolveEdgePath();
    if (!executable) {
      const err = new Error(
        'Microsoft Edge not found. Install Edge or set EDGE_PATH to msedge.exe (Windows) or Microsoft Edge (macOS).'
      );
      err.code = 'ERR_EDGE_NOT_FOUND';
      throw err;
    }
    return { kind: 'edge', executable, extensionsUrl: 'edge://extensions' };
  }

  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return {
      kind: 'chrome',
      executable: process.env.CHROME_PATH,
      extensionsUrl: 'chrome://extensions',
    };
  }

  try {
    const executable = chromeLauncher.getChromePath();
    return { kind: 'chrome', executable, extensionsUrl: 'chrome://extensions' };
  } catch (e) {
    if (e && e.code === 'ERR_LAUNCHER_NOT_INSTALLED') {
      const err = new Error(
        'Google Chrome not found. Install Chrome, set CHROME_PATH, or use Edge with BROWSER=edge npm run dev'
      );
      err.code = 'ERR_CHROME_NOT_FOUND';
      throw err;
    }
    throw e;
  }
}

module.exports = { resolveBrowser, resolveEdgePath };
