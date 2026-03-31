/**
 * Recently closed tabs and windows via chrome.sessions (Chrome sync’d list).
 * Uses global `t`, `formatRelativeTime`, and `formatTabHistoryClosedDate` from i18n.js.
 */

/** Max sessions returned by Chrome API (cap 25). */
const TAB_HISTORY_FETCH_MAX = 25;

/** Rows shown in the list when not searching (keeps the panel compact). */
const TAB_HISTORY_LIST_MAX = 10;

/** @type {boolean} */
let historyPanelExpanded = false;

/** @type {chrome.sessions.Session[] | null} */
let tabHistorySessionsCache = null;

/** @type {boolean} */
let tabHistoryLoadFailed = false;

/** @type {Map<string, string>} sessionId → device name when getDevices matches a closed session. */
let tabHistorySessionDeviceMap = new Map();

/** @type {string} */
let tabHistoryPlatformOsKey = '';

/**
 * Chrome's `sessions.Session.lastModified` is **seconds** since epoch (see Chrome docs);
 * `Date` and `formatRelativeTime` expect milliseconds. Values already in ms (>= 1e12) are left as-is.
 * @param {number | undefined} raw
 * @returns {number | undefined}
 */
function tabHistorySessionTimeMs(raw) {
  if (raw == null || raw === 0) return undefined;
  return raw < 1e12 ? raw * 1000 : raw;
}

/**
 * @returns {number}
 */
function tabHistoryStartOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Counts recently closed sessions whose close time falls on the local calendar day.
 * Limited by {@link TAB_HISTORY_FETCH_MAX} (older “today” closes may be missing).
 * @param {chrome.sessions.Session[]} sessions
 * @returns {number}
 */
function tabHistoryCountClosedToday(sessions) {
  const start = tabHistoryStartOfTodayMs();
  let n = 0;
  for (const s of sessions) {
    const ms = tabHistorySessionTimeMs(s.lastModified);
    if (ms != null && ms >= start) n += 1;
  }
  return n;
}

/**
 * @param {chrome.sessions.Session} session
 * @returns {string}
 */
function tabHistoryGetDeviceLabel(session) {
  const sid = session.sessionId;
  if (sid && tabHistorySessionDeviceMap.has(sid)) {
    const name = tabHistorySessionDeviceMap.get(sid);
    if (name) return name;
  }
  const osMap = t.tabHistoryOs;
  const osLabel =
    osMap && tabHistoryPlatformOsKey ? osMap[tabHistoryPlatformOsKey] : '';
  if (osLabel) return `${t.tabHistoryThisDevice} · ${osLabel}`;
  return t.tabHistoryThisDevice;
}

/**
 * Right column: absolute closed time and relative age + device (or synced device name).
 * @param {chrome.sessions.Session} session
 * @returns {HTMLDivElement}
 */
function tabHistoryCreateMeta(session) {
  const closedAtMs = tabHistorySessionTimeMs(session.lastModified);
  const closedAgo = closedAtMs
    ? formatRelativeTime(closedAtMs)
    : t.tabUsageMetricUnavailable;
  const dateStr = closedAtMs
    ? formatTabHistoryClosedDate(closedAtMs)
    : t.tabUsageMetricUnavailable;
  const subLine = `${closedAgo} · ${tabHistoryGetDeviceLabel(session)}`;

  const meta = document.createElement('div');
  meta.className = 'tab-history-row-meta';
  const lineDate = document.createElement('span');
  lineDate.className = 'tab-history-row-meta-date';
  lineDate.textContent = dateStr;
  const lineSub = document.createElement('span');
  lineSub.className = 'tab-history-row-meta-sub';
  lineSub.textContent = subLine;
  meta.appendChild(lineDate);
  meta.appendChild(lineSub);
  return meta;
}

/**
 * @param {string | undefined} url
 * @returns {string}
 */
function tabHistoryHost(url) {
  try {
    return new URL(url || '').hostname;
  } catch {
    return '';
  }
}

/**
 * @param {string | undefined} url
 * @returns {string}
 */
function tabHistoryFaviconUrl(url) {
  try {
    const u = new URL(url || '');
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return '';
  }
}

/**
 * @param {string} title
 * @param {number} maxLen
 * @returns {string}
 */
function truncateTitle(title, maxLen) {
  if (!title) return '';
  return title.length > maxLen ? `${title.slice(0, maxLen - 1)}…` : title;
}

/**
 * @param {{ url?: string, pendingUrl?: string } | undefined} tab
 * @returns {string}
 */
function tabHistorySessionTabUrl(tab) {
  if (!tab) return '';
  const u = tab.url && tab.url.length > 0 ? tab.url : tab.pendingUrl;
  return typeof u === 'string' ? u.trim() : '';
}

/**
 * Collects navigable URLs for a recently closed session (single tab or whole window).
 * @param {chrome.sessions.Session} session
 * @returns {string[]}
 */
function tabHistoryCollectSessionUrls(session) {
  const urls = [];
  if (session.tab) {
    const u = tabHistorySessionTabUrl(session.tab);
    if (u) urls.push(u);
  } else if (session.window && session.window.tabs && session.window.tabs.length) {
    for (const tab of session.window.tabs) {
      const u = tabHistorySessionTabUrl(tab);
      if (u) urls.push(u);
    }
  }
  return urls;
}

/**
 * Opens restored URLs in the current profile: one tab per URL (first focused).
 * Falls back to chrome.sessions.restore if no URLs are known or every create fails.
 * @param {chrome.sessions.Session} session
 */
async function tabHistoryOpenSessionUrls(session) {
  const urls = tabHistoryCollectSessionUrls(session);
  if (urls.length === 0) {
    try {
      await chrome.sessions.restore(session.sessionId);
    } catch {
      /* ignore */
    }
    return;
  }
  let opened = 0;
  for (let i = 0; i < urls.length; i++) {
    try {
      await chrome.tabs.create({ url: urls[i], active: i === 0 });
      opened += 1;
    } catch {
      /* invalid or blocked URL for tabs.create */
    }
  }
  if (opened === 0) {
    try {
      await chrome.sessions.restore(session.sessionId);
    } catch {
      /* ignore */
    }
  }
}

/**
 * @returns {string}
 */
function getTabHistorySearchQuery() {
  const el = document.getElementById('tab-history-search');
  return (el?.value || '').trim().toLowerCase();
}

/**
 * @param {chrome.sessions.Session} session
 * @returns {string}
 */
function tabHistorySessionSearchBlob(session) {
  const parts = [];
  if (session.tab) {
    const tab = session.tab;
    parts.push(tab.title || '', tab.url || '', tabHistoryHost(tab.url));
  } else if (session.window && session.window.tabs && session.window.tabs.length) {
    for (const tab of session.window.tabs) {
      parts.push(tab.title || '', tab.url || '', tabHistoryHost(tab.url));
    }
  }
  return parts.join(' ').toLowerCase();
}

/**
 * @param {chrome.sessions.Session} session
 * @param {string} query
 * @returns {boolean}
 */
function tabHistorySessionMatches(session, query) {
  if (!query) return true;
  const hay = tabHistorySessionSearchBlob(session);
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

/**
 * @param {HTMLElement} listEl
 * @param {chrome.sessions.Session} session
 */
function tabHistoryAppendSessionRow(parentUl, session) {
  const li = document.createElement('li');
  li.className = 'tab-history-item';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tab-history-row';
  btn.title = t.tabHistoryRestoreTitle;

  if (session.tab) {
    const tab = session.tab;
    const url = tab.url || '';
    const host = tabHistoryHost(url) || '—';
    const fav = tabHistoryFaviconUrl(url);

    const main = document.createElement('div');
    main.className = 'tab-history-row-main';

    if (fav) {
      const img = document.createElement('img');
      img.className = 'tab-history-favicon';
      img.loading = 'lazy';
      img.src = fav;
      img.alt = '';
      img.width = 16;
      img.height = 16;
      main.appendChild(img);
    }

    const text = document.createElement('div');
    text.className = 'tab-history-row-text';
    const t1 = document.createElement('span');
    t1.className = 'tab-history-row-title';
    t1.textContent = truncateTitle(tab.title || host || url, 48);
    const t2 = document.createElement('span');
    t2.className = 'tab-history-row-sub';
    t2.textContent = host;
    text.appendChild(t1);
    text.appendChild(t2);
    main.appendChild(text);

    btn.appendChild(main);
    btn.appendChild(tabHistoryCreateMeta(session));
  } else if (session.window && session.window.tabs && session.window.tabs.length) {
    const tabs = session.window.tabs;
    const n = tabs.length;
    const first = tabs[0];
    const url = first.url || '';
    const host = tabHistoryHost(url);
    const fav = tabHistoryFaviconUrl(url);

    const main = document.createElement('div');
    main.className = 'tab-history-row-main';

    const winIcon = document.createElement('span');
    winIcon.className = 'tab-history-window-icon';
    winIcon.setAttribute('aria-hidden', 'true');
    winIcon.innerHTML =
      '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"/></svg>';
    main.appendChild(winIcon);

    if (fav) {
      const img = document.createElement('img');
      img.className = 'tab-history-favicon tab-history-favicon--stacked';
      img.loading = 'lazy';
      img.src = fav;
      img.alt = '';
      img.width = 16;
      img.height = 16;
      main.appendChild(img);
    }

    const text = document.createElement('div');
    text.className = 'tab-history-row-text';
    const t1 = document.createElement('span');
    t1.className = 'tab-history-row-title';
    t1.textContent = t.tabHistoryWindowTabs(n);
    const t2 = document.createElement('span');
    t2.className = 'tab-history-row-sub';
    t2.textContent =
      n > 1
        ? `${truncateTitle(first.title || host, 36)} (+${n - 1})`
        : truncateTitle(first.title || host || url, 48);
    text.appendChild(t1);
    text.appendChild(t2);
    main.appendChild(text);

    btn.appendChild(main);
    btn.appendChild(tabHistoryCreateMeta(session));
  } else {
    return;
  }

  btn.addEventListener('click', () => {
    tabHistoryOpenSessionUrls(session);
  });

  li.appendChild(btn);
  parentUl.appendChild(li);
}

/**
 * Renders the list from cache and current search query.
 */
function renderTabHistoryList() {
  const listEl = document.getElementById('tab-history-list');
  if (!listEl) return;

  if (tabHistoryLoadFailed) {
    listEl.innerHTML = '';
    const err = document.createElement('p');
    err.className = 'tab-history-empty';
    err.textContent = t.tabHistoryUnavailable;
    listEl.appendChild(err);
    return;
  }

  if (tabHistorySessionsCache === null) {
    listEl.innerHTML = '';
    return;
  }

  const query = getTabHistorySearchQuery();
  let sessions = tabHistorySessionsCache.filter((s) => {
    if (s.tab) return tabHistorySessionMatches(s, query);
    if (s.window && s.window.tabs && s.window.tabs.length) return tabHistorySessionMatches(s, query);
    return false;
  });

  if (!query) {
    sessions = sessions.slice(0, TAB_HISTORY_LIST_MAX);
  }

  listEl.innerHTML = '';

  if (!tabHistorySessionsCache.length) {
    const empty = document.createElement('p');
    empty.className = 'tab-history-empty';
    empty.textContent = t.tabHistoryEmpty;
    listEl.appendChild(empty);
    return;
  }

  if (!sessions.length) {
    const empty = document.createElement('p');
    empty.className = 'tab-history-empty';
    empty.textContent = query ? t.tabHistoryNoSearchResults : t.tabHistoryEmpty;
    listEl.appendChild(empty);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'tab-history-items';

  for (const session of sessions) {
    tabHistoryAppendSessionRow(ul, session);
  }

  listEl.appendChild(ul);
}

/**
 * Updates the tab history panel header (open last, closed today count).
 */
function updateTabHistoryHeader() {
  const btn = document.getElementById('tab-history-open-last');
  const todayEl = document.getElementById('tab-history-closed-today');
  const toggle = document.getElementById('toggle-tab-history');
  if (!btn || !todayEl) return;

  if (tabHistoryLoadFailed) {
    btn.disabled = true;
    todayEl.textContent = t.tabHistoryClosedTodayCount(0);
    if (toggle) toggle.setAttribute('aria-label', t.featureTabHistory);
    return;
  }

  if (tabHistorySessionsCache === null) {
    btn.disabled = true;
    todayEl.textContent = '';
    if (toggle) toggle.setAttribute('aria-label', t.featureTabHistory);
    return;
  }

  const sessions = tabHistorySessionsCache;
  const nToday = tabHistoryCountClosedToday(sessions);
  const hasLast = sessions.length > 0;
  btn.disabled = !hasLast;
  todayEl.textContent = t.tabHistoryClosedTodayCount(nToday);

  if (toggle) {
    toggle.setAttribute(
      'aria-label',
      `${t.featureTabHistory}. ${t.tabHistoryClosedTodayCount(nToday)}`
    );
  }
}

/**
 * Fetches recently closed sessions and re-renders when expanded (keeps search query).
 */
async function refreshTabHistory() {
  const listEl = document.getElementById('tab-history-list');
  if (!listEl) return;

  tabHistorySessionDeviceMap = new Map();
  try {
    const devices = await chrome.sessions.getDevices();
    for (const d of devices) {
      for (const s of d.sessions || []) {
        if (s.sessionId) tabHistorySessionDeviceMap.set(s.sessionId, d.deviceName);
      }
    }
  } catch {
    /* sync/device list may be unavailable */
  }

  let sessions;
  try {
    sessions = await chrome.sessions.getRecentlyClosed({
      maxResults: TAB_HISTORY_FETCH_MAX,
    });
  } catch {
    tabHistorySessionsCache = null;
    tabHistoryLoadFailed = true;
    updateTabHistoryHeader();
    if (historyPanelExpanded) {
      renderTabHistoryList();
    }
    return;
  }

  tabHistoryLoadFailed = false;
  tabHistorySessionsCache = sessions;
  updateTabHistoryHeader();
  if (historyPanelExpanded) {
    renderTabHistoryList();
  }
}

/**
 * @returns {boolean}
 */
function readHistoryExpanded() {
  const btn = document.getElementById('toggle-tab-history');
  return btn?.getAttribute('aria-expanded') === 'true';
}

function syncHistoryExpandedAndRefresh() {
  historyPanelExpanded = readHistoryExpanded();
  if (historyPanelExpanded) refreshTabHistory();
}

function applyTabHistoryStaticLabels() {
  const foot = document.getElementById('tab-history-footnote');
  const search = document.getElementById('tab-history-search');
  const openLast = document.getElementById('tab-history-open-last');
  const toolbar = document.getElementById('tab-history-header-toolbar');
  if (foot) foot.textContent = t.tabHistoryFootnote;
  if (search) search.placeholder = t.tabHistorySearchPlaceholder;
  if (openLast) openLast.textContent = t.tabHistoryOpenLastClosed;
  if (toolbar) toolbar.setAttribute('aria-label', t.tabHistoryHeaderToolbar);
  updateTabHistoryHeader();
}

/**
 * Wires the Tab history panel: refresh when expanded and on session changes.
 */
function initTabHistory() {
  const historyBtn = document.getElementById('toggle-tab-history');
  const searchEl = document.getElementById('tab-history-search');
  const openLastBtn = document.getElementById('tab-history-open-last');

  window.tabHistoryApplyTranslations = () => {
    applyTabHistoryStaticLabels();
    if (historyPanelExpanded && (tabHistorySessionsCache !== null || tabHistoryLoadFailed)) {
      renderTabHistoryList();
    }
  };

  if (historyBtn) {
    historyBtn.addEventListener('click', () => {
      window.setTimeout(() => {
        syncHistoryExpandedAndRefresh();
      }, 0);
    });
  }

  if (openLastBtn) {
    openLastBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!tabHistorySessionsCache || tabHistorySessionsCache.length === 0) return;
      tabHistoryOpenSessionUrls(tabHistorySessionsCache[0]);
    });
  }

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      renderTabHistoryList();
    });
  }

  historyPanelExpanded = readHistoryExpanded();
  refreshTabHistory();

  chrome.runtime.getPlatformInfo().then((info) => {
    tabHistoryPlatformOsKey = info.os;
    if (historyPanelExpanded && tabHistorySessionsCache !== null) {
      renderTabHistoryList();
    }
  });

  chrome.sessions.onChanged.addListener(() => {
    refreshTabHistory();
  });
}
