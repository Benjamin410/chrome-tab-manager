chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

/** @type {string} Storage key for tabId → first-seen timestamp (ms) for Tab usage panel */
const TAB_USAGE_OPENED_KEY = 'tabUsageTabOpenedAt';

/** @type {string} Storage key for tabId → HTML head-derived label string (tab browser) */
const TAB_PAGE_LABELS_KEY = 'tabPageLabels';

/**
 * Loads the tab first-seen map from storage.
 * @returns {Promise<Record<string, number>>}
 */
async function getTabUsageOpenedMap() {
  const data = await chrome.storage.local.get(TAB_USAGE_OPENED_KEY);
  return data[TAB_USAGE_OPENED_KEY] || {};
}

/**
 * Persists the tab first-seen map.
 * @param {Record<string, number>} map
 */
async function setTabUsageOpenedMap(map) {
  await chrome.storage.local.set({ [TAB_USAGE_OPENED_KEY]: map });
}

/**
 * Records when a tab was first seen by the extension (for "tracked since").
 * @param {number} tabId
 */
async function recordTabUsageOpened(tabId) {
  const map = await getTabUsageOpenedMap();
  const key = String(tabId);
  if (!(key in map)) {
    map[key] = Date.now();
    await setTabUsageOpenedMap(map);
  }
}

/**
 * Removes a tab id from the first-seen map when the tab closes.
 * @param {number} tabId
 */
async function removeTabUsageOpened(tabId) {
  const map = await getTabUsageOpenedMap();
  const key = String(tabId);
  if (key in map) {
    delete map[key];
    await setTabUsageOpenedMap(map);
  }
}

/**
 * Backfills missing tab ids and prunes stale ids (e.g. after a crash).
 */
async function backfillTabUsageOpened() {
  const tabs = await chrome.tabs.query({});
  const map = await getTabUsageOpenedMap();
  const currentIds = new Set(tabs.map((t) => String(t.id)));
  const now = Date.now();
  let changed = false;
  for (const tab of tabs) {
    const key = String(tab.id);
    if (!(key in map)) {
      map[key] = now;
      changed = true;
    }
  }
  for (const key of Object.keys(map)) {
    if (!currentIds.has(key)) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) await setTabUsageOpenedMap(map);
}

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id !== undefined) recordTabUsageOpened(tab.id);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  removeTabUsageOpened(tabId);
  removeTabPageLabel(tabId);
});

backfillTabUsageOpened();

/**
 * Loads tabId → page label map from storage.
 * @returns {Promise<Record<string, string>>}
 */
async function getTabPageLabelsMap() {
  const data = await chrome.storage.local.get(TAB_PAGE_LABELS_KEY);
  return data[TAB_PAGE_LABELS_KEY] || {};
}

/**
 * Persists the tab page labels map.
 * @param {Record<string, string>} map
 */
async function setTabPageLabelsMap(map) {
  await chrome.storage.local.set({ [TAB_PAGE_LABELS_KEY]: map });
}

/**
 * Stores or clears the HTML head label for a tab (content script sends after document_idle).
 * @param {number} tabId
 * @param {string} label
 */
async function setTabPageLabel(tabId, label) {
  const map = await getTabPageLabelsMap();
  const key = String(tabId);
  if (!label) {
    if (key in map) {
      delete map[key];
      await setTabPageLabelsMap(map);
    }
  } else {
    map[key] = label;
    await setTabPageLabelsMap(map);
  }
}

/**
 * Removes a tab id from the page labels map when the tab closes.
 * @param {number} tabId
 */
async function removeTabPageLabel(tabId) {
  const map = await getTabPageLabelsMap();
  const key = String(tabId);
  if (key in map) {
    delete map[key];
    await setTabPageLabelsMap(map);
  }
}

/**
 * Drops stale tab ids from the page labels map (e.g. after crash or missed events).
 */
async function backfillTabPageLabels() {
  const tabs = await chrome.tabs.query({});
  const map = await getTabPageLabelsMap();
  const currentIds = new Set(tabs.map((t) => String(t.id)));
  let changed = false;
  for (const key of Object.keys(map)) {
    if (!currentIds.has(key)) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) await setTabPageLabelsMap(map);
}

backfillTabPageLabels();

const TAB_EVENTS = ['onCreated', 'onRemoved', 'onUpdated', 'onActivated', 'onMoved', 'onDetached', 'onAttached'];

TAB_EVENTS.forEach(event => {
  if (chrome.tabs[event]) {
    chrome.tabs[event].addListener(() => {
      chrome.runtime.sendMessage({ type: 'tabs-changed' }).catch(() => {});
    });
  }
});

chrome.windows.onRemoved.addListener(() => {
  chrome.runtime.sendMessage({ type: 'tabs-changed' }).catch(() => {});
});

// Track open side panel ports per window
const panelPorts = new Map();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    // Side panel connects per window, not per tab
    const windowId = port.sender?.tab?.windowId;
    if (windowId) panelPorts.set(windowId, port);
    port.onDisconnect.addListener(() => {
      if (windowId) panelPorts.delete(windowId);
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'tab-page-label') {
    if (sender.tab?.id === undefined) {
      console.error('[TabManager page-label] service worker: missing sender.tab — label not stored', {
        url: sender.url,
      });
      sendResponse({ ok: false, error: 'no-sender-tab' });
      return false;
    }
    const label = typeof msg.label === 'string' ? msg.label : '';
    const tabId = sender.tab.id;
    const url = sender.tab.url || '';
    void setTabPageLabel(tabId, label).then(() => {
      console.log('[TabManager page-label] service worker', {
        tabId,
        url: url.length > 200 ? `${url.slice(0, 200)}…` : url,
        action: label ? 'stored' : 'empty-not-stored',
        storedLength: label.length,
        preview: label
          ? (label.length > 160 ? `${label.slice(0, 160)}…` : label)
          : undefined,
      });
    });
    sendResponse({ ok: true });
    return false;
  }
  if (msg.type === 'toggle-side-panel' && sender.tab) {
    const windowId = sender.tab.windowId;
    const tabId = sender.tab.id;
    const existingPort = panelPorts.get(windowId);

    if (existingPort) {
      // Panel is open — tell it to close itself
      try {
        existingPort.postMessage({ type: 'close' });
      } catch (e) {
        panelPorts.delete(windowId);
      }
      sendResponse({ ok: true });
    } else {
      // Panel is closed — open it
      chrome.sidePanel.open({ tabId }).then(() => {
        sendResponse({ ok: true });
      }).catch((err) => {
        sendResponse({ ok: false, error: err.message });
      });
    }
    return true;
  }
});
