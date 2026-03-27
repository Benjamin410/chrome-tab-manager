/**
 * Tab usage: aggregate counts and per-tab details from chrome.tabs.Tab.
 * Uses global `t` and `formatRelativeTime` from i18n.js.
 */

const TAB_USAGE_STORAGE_KEY = 'tabUsageTabOpenedAt';

/** @type {ReturnType<typeof setInterval> | null} */
let pollTimer = null;

/** @type {boolean} */
let usagePanelExpanded = false;

const POLL_MS = 4000;

/**
 * Maps each windowId to a stable 1-based index (sorted by id).
 * @param {chrome.tabs.Tab[]} tabs
 * @returns {Map<number, number>}
 */
function buildWindowIndexMap(tabs) {
  const ids = [...new Set(tabs.map((x) => x.windowId))].sort((a, b) => a - b);
  const m = new Map();
  ids.forEach((id, i) => m.set(id, i + 1));
  return m;
}

/**
 * @param {chrome.tabs.Tab[]} tabs
 * @returns {{ tabs: number, windows: number, discarded: number, loading: number, incognito: number, muted: number }}
 */
function computeTabUsageAggregates(tabs) {
  const windows = new Set(tabs.map((x) => x.windowId)).size;
  const discarded = tabs.filter((x) => x.discarded).length;
  const loading = tabs.filter((x) => x.status === 'loading').length;
  const incognito = tabs.filter((x) => x.incognito).length;
  const muted = tabs.filter((x) => x.mutedInfo?.muted).length;
  return {
    tabs: tabs.length,
    windows,
    discarded,
    loading,
    incognito,
    muted,
  };
}

/**
 * @param {chrome.tabs.Tab} tab
 * @returns {string}
 */
function tabStatusLabel(tab) {
  const s = tab.status || 'complete';
  if (s === 'loading') return t.tabUsageStatusLoading;
  if (s === 'unloaded') return t.tabUsageStatusUnloaded;
  return t.tabUsageStatusComplete;
}

/**
 * @param {string | undefined} url
 * @returns {string}
 */
function tabUsageGetHost(url) {
  try {
    return new URL(url || '').hostname;
  } catch {
    return '—';
  }
}

/**
 * @param {string} s
 * @param {number} maxLen
 * @returns {string}
 */
function truncateTitle(s, maxLen) {
  if (!s) return '';
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
}

/**
 * @param {HTMLElement} el
 * @param {{ tabs: number, windows: number, discarded: number }} data
 */
function renderHeaderSummary(el, data) {
  const parts = [
    `${data.tabs} ${t.tabUsageTabs}`,
    `${data.windows} ${t.tabUsageWindows}`,
  ];
  if (data.discarded > 0) {
    parts.push(`${data.discarded} ${t.tabUsageDiscarded}`);
  }
  el.textContent = parts.join(' · ');
}

/**
 * @param {{ tabs: number, windows: number, discarded: number }} data
 */
function setTabUsageToggleAriaLabel(data) {
  const btn = document.getElementById('toggle-tab-usage');
  if (!btn) return;
  let label = `${t.featureTabUsage}. ${data.tabs} ${t.tabUsageTabs}, ${data.windows} ${t.tabUsageWindows}`;
  if (data.discarded > 0) {
    label += `, ${data.discarded} ${t.tabUsageDiscarded}`;
  }
  btn.setAttribute('aria-label', label);
}

/**
 * @param {HTMLElement} dashboardEl
 * @param {{ tabs: number, windows: number, discarded: number, loading: number, incognito: number, muted: number }} data
 */
function renderDashboard(dashboardEl, data) {
  dashboardEl.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'tab-usage-metrics';

  function card(label, value) {
    const c = document.createElement('div');
    c.className = 'tab-usage-metric';
    const lab = document.createElement('span');
    lab.className = 'tab-usage-metric-label';
    lab.textContent = label;
    const val = document.createElement('span');
    val.className = 'tab-usage-metric-value';
    val.textContent = value;
    c.appendChild(lab);
    c.appendChild(val);
    return c;
  }

  grid.appendChild(card(t.tabUsageTabs, String(data.tabs)));
  grid.appendChild(card(t.tabUsageWindows, String(data.windows)));
  grid.appendChild(card(t.tabUsageDiscarded, String(data.discarded)));
  grid.appendChild(card(t.tabUsageLoading, String(data.loading)));
  grid.appendChild(card(t.tabUsageIncognito, String(data.incognito)));
  grid.appendChild(card(t.tabUsageMuted, String(data.muted)));

  dashboardEl.appendChild(grid);
}

/**
 * @param {HTMLElement} wrap
 * @param {chrome.tabs.Tab[]} tabs
 * @param {Record<string, number>} openedMap
 * @param {Map<number, number>} windowIndexMap
 */
function renderTabTable(wrap, tabs, openedMap, windowIndexMap) {
  wrap.innerHTML = '';
  const sorted = [...tabs].sort(
    (a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0)
  );

  if (sorted.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'tab-usage-empty';
    empty.textContent = t.tabUsageNoTabs;
    wrap.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'tab-usage-table';
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  [
    'tabUsageColumnTitle',
    'tabUsageColumnHost',
    'tabUsageColumnWindow',
    'tabUsageColumnIndex',
    'tabUsageColumnStatus',
    'tabUsageColumnLastActive',
    'tabUsageColumnTracked',
  ].forEach((key) => {
    const th = document.createElement('th');
    th.textContent = t[key];
    if (key !== 'tabUsageColumnTitle' && key !== 'tabUsageColumnHost') {
      th.className = 'tab-usage-th-narrow';
    }
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const tab of sorted) {
    const tr = document.createElement('tr');
    const title = truncateTitle(tab.title || '', 28);
    const host = tabUsageGetHost(tab.url);
    const last = formatRelativeTime(tab.lastAccessed) || t.tabUsageMetricUnavailable;
    const tid = tab.id !== undefined ? String(tab.id) : '';
    const trackedMs = tid ? openedMap[tid] : undefined;
    const tracked = trackedMs ? formatRelativeTime(trackedMs) : t.tabUsageMetricUnavailable;

    const winNum =
      tab.windowId !== undefined ? windowIndexMap.get(tab.windowId) : undefined;
    const winLabel = winNum !== undefined ? String(winNum) : t.tabUsageMetricUnavailable;
    const posLabel =
      tab.index !== undefined ? String(tab.index + 1) : t.tabUsageMetricUnavailable;
    const statusText = tabStatusLabel(tab);

    const td0 = document.createElement('td');
    td0.className = 'tab-usage-cell-title';
    const titleRow = document.createElement('div');
    titleRow.className = 'tab-usage-title-row';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-usage-title-text';
    titleSpan.textContent = title;
    titleRow.appendChild(titleSpan);
    const badges = document.createElement('span');
    badges.className = 'tab-usage-badges';
    if (tab.active) {
      const b = document.createElement('span');
      b.className = 'tab-usage-badge tab-usage-badge--active';
      b.textContent = t.tabUsageBadgeActive;
      badges.appendChild(b);
    }
    if (tab.pinned) {
      const b = document.createElement('span');
      b.className = 'tab-usage-badge tab-usage-badge--pinned';
      b.textContent = t.tabUsageBadgePinned;
      badges.appendChild(b);
    }
    if (tab.discarded) {
      const b = document.createElement('span');
      b.className = 'tab-usage-badge tab-usage-badge--discarded';
      b.textContent = t.tabUsageBadgeDiscarded;
      badges.appendChild(b);
    }
    if (tab.audible) {
      const b = document.createElement('span');
      b.className = 'tab-usage-badge tab-usage-badge--audible';
      b.textContent = t.tabUsageBadgeAudible;
      badges.appendChild(b);
    }
    if (tab.incognito) {
      const b = document.createElement('span');
      b.className = 'tab-usage-badge tab-usage-badge--incognito';
      b.textContent = t.tabUsageBadgeIncognito;
      badges.appendChild(b);
    }
    if (tab.mutedInfo?.muted) {
      const b = document.createElement('span');
      b.className = 'tab-usage-badge tab-usage-badge--muted';
      b.textContent = t.tabUsageBadgeMuted;
      badges.appendChild(b);
    }
    if (tab.frozen) {
      const b = document.createElement('span');
      b.className = 'tab-usage-badge tab-usage-badge--frozen';
      b.textContent = t.tabUsageBadgeFrozen;
      badges.appendChild(b);
    }
    titleRow.appendChild(badges);
    td0.appendChild(titleRow);

    const td1 = document.createElement('td');
    td1.textContent = host;
    const td2 = document.createElement('td');
    td2.className = 'tab-usage-cell-narrow';
    td2.textContent = winLabel;
    const td3 = document.createElement('td');
    td3.className = 'tab-usage-cell-narrow';
    td3.textContent = posLabel;
    const td4 = document.createElement('td');
    td4.className = 'tab-usage-cell-narrow';
    td4.textContent = statusText;
    const td5 = document.createElement('td');
    td5.textContent = last;
    const td6 = document.createElement('td');
    td6.textContent = tracked;

    tr.appendChild(td0);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    tr.appendChild(td5);
    tr.appendChild(td6);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
}

/**
 * Fetches UI data and renders tab usage header; dashboard and table when expanded.
 */
async function refreshTabUsage() {
  const headerEl = document.getElementById('tab-usage-header-summary');
  const dashboardEl = document.getElementById('tab-usage-dashboard');
  const listTab = document.getElementById('tab-usage-list-tab');

  const tabs = await chrome.tabs.query({});
  const data = computeTabUsageAggregates(tabs);

  if (headerEl) {
    renderHeaderSummary(headerEl, data);
  }
  setTabUsageToggleAriaLabel(data);

  if (!usagePanelExpanded || !dashboardEl || !listTab) {
    return;
  }

  const storage = await chrome.storage.local.get(TAB_USAGE_STORAGE_KEY);
  /** @type {Record<string, number>} */
  const openedMap = storage[TAB_USAGE_STORAGE_KEY] || {};

  const windowIndexMap = buildWindowIndexMap(tabs);

  renderDashboard(dashboardEl, data);

  renderTabTable(listTab, tabs, openedMap, windowIndexMap);
}

function startTabUsagePolling() {
  stopTabUsagePolling();
  pollTimer = setInterval(() => {
    refreshTabUsage();
  }, POLL_MS);
}

function stopTabUsagePolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/**
 * Reads expand state from the Tab usage toggle button.
 * @returns {boolean}
 */
function readUsageExpanded() {
  const btn = document.getElementById('toggle-tab-usage');
  return btn?.getAttribute('aria-expanded') === 'true';
}

function syncUsageExpandedState() {
  usagePanelExpanded = readUsageExpanded();
  if (usagePanelExpanded) {
    refreshTabUsage();
    startTabUsagePolling();
  } else {
    stopTabUsagePolling();
  }
}

function applyTabUsageStaticLabels() {
  const foot = document.getElementById('tab-usage-footnote');
  const hTabs = document.getElementById('tab-usage-heading-tabs');
  if (foot) foot.textContent = t.tabUsageFootnote;
  if (hTabs) hTabs.textContent = t.tabUsageSubsectionTabs;
}

/**
 * Initializes Tab usage panel: polling when expanded, translations, and tab-change refresh.
 */
function initTabUsage() {
  const usageBtn = document.getElementById('toggle-tab-usage');

  window.tabUsageApplyTranslations = () => {
    applyTabUsageStaticLabels();
    refreshTabUsage();
  };

  if (usageBtn) {
    usageBtn.addEventListener('click', () => {
      window.setTimeout(() => {
        syncUsageExpandedState();
      }, 0);
    });
  }

  usagePanelExpanded = readUsageExpanded();
  refreshTabUsage();
  if (usagePanelExpanded) {
    startTabUsagePolling();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'tabs-changed') {
      refreshTabUsage();
    }
  });
}
