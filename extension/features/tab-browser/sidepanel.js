// State
let allTabs = [];
let expandedDomains = new Set();
let groupByWindow = false;
let filterWindowId = null;
let groupOperationInProgress = false;
/** When true, show HTML head-derived labels on domain rows and tab rows. */
let showPageLabels = false;
/** @type {'titleAsc' | 'titleDesc' | 'timeAsc' | 'timeDesc'} */
let tabSortMode = 'timeDesc';
/** @type {Record<string, string>} Maps domain → custom display name */
let customDomainNames = {};

// Tab group colors
const TAB_GROUP_COLORS = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

function pickGroupColor(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash) + domain.charCodeAt(i);
    hash |= 0;
  }
  return TAB_GROUP_COLORS[Math.abs(hash) % TAB_GROUP_COLORS.length];
}

function getDisplayName(domain) {
  return customDomainNames[domain] || domain;
}

async function setCustomDomainName(domain, customName) {
  if (customName && customName !== domain) {
    customDomainNames[domain] = customName;
  } else {
    delete customDomainNames[domain];
  }
  await chrome.storage.local.set({ customDomainNames });
}

// Elements
const tabListEl = document.getElementById('tab-list');
const searchEl = document.getElementById('search');
const tabCountEl = document.getElementById('tab-count');
const closeOldEl = document.getElementById('close-old');
const themeToggleEl = document.getElementById('theme-toggle');
const windowToggleEl = document.getElementById('window-toggle');
const windowToggleLabelEl = document.getElementById('window-toggle-label');
const labelsToggleEl = document.getElementById('labels-toggle');
const labelsToggleLabelEl = document.getElementById('labels-toggle-label');
const windowFilterEl = document.getElementById('window-filter');
const langSelectEl = document.getElementById('lang-select');
const confirmDialog = document.getElementById('confirm-dialog');
const confirmMessage = document.getElementById('confirm-message');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');
const bannerLeftBtn = document.getElementById('banner-left');
const bannerRightBtn = document.getElementById('banner-right');
const bannerOffBtn = document.getElementById('banner-off');
const tabSortSelectEl = document.getElementById('tab-sort-select');
const mergeSameSitesBtn = document.getElementById('merge-same-sites');
const tabSortToolbarEl = document.querySelector('.tab-sort-toolbar');
const footerBannerControlsEl = document.querySelector('.footer-banner-controls');
const featureTitleTabHistory = document.getElementById('feature-title-tab-history');
const featureTitleTabUsage = document.getElementById('feature-title-tab-usage');

// Apply all translatable strings to the UI
function applyTranslations() {
  searchEl.placeholder = t.searchPlaceholder;
  searchEl.setAttribute('aria-label', t.searchPlaceholder);
  closeOldEl.textContent = t.closeOld;
  themeToggleEl.title = t.themeToggle;
  windowToggleLabelEl.textContent = t.windowGrouping;
  confirmCancel.textContent = t.cancel;
  confirmOk.textContent = t.close;
  if (tabSortToolbarEl) tabSortToolbarEl.setAttribute('aria-label', t.tabSortToolbarAria);
  if (footerBannerControlsEl) footerBannerControlsEl.setAttribute('aria-label', t.bannerEdgePositionGroup);
  tabSortSelectEl.setAttribute('aria-label', t.tabSortSelectAria);
  tabSortSelectEl.querySelector('option[value="titleAsc"]').textContent = t.sortTitleAsc;
  tabSortSelectEl.querySelector('option[value="titleDesc"]').textContent = t.sortTitleDesc;
  tabSortSelectEl.querySelector('option[value="timeAsc"]').textContent = t.sortTimeAsc;
  tabSortSelectEl.querySelector('option[value="timeDesc"]').textContent = t.sortTimeDesc;
  mergeSameSitesBtn.title = t.mergeSameSitesTitle;
  mergeSameSitesBtn.setAttribute('aria-label', t.mergeSameSitesTitle);
  if (labelsToggleEl && labelsToggleLabelEl) {
    labelsToggleLabelEl.textContent = t.pageLabels;
    labelsToggleEl.setAttribute('aria-label', t.pageLabelsToggleAria);
    updateLabelsToggle();
  }
  bannerLeftBtn.title = t.bannerPositionLeft;
  bannerLeftBtn.setAttribute('aria-label', t.bannerPositionLeft);
  bannerRightBtn.title = t.bannerPositionRight;
  bannerRightBtn.setAttribute('aria-label', t.bannerPositionRight);
  bannerOffBtn.title = t.bannerPositionOff;
  bannerOffBtn.setAttribute('aria-label', t.bannerPositionOff);
  featureTitleTabHistory.textContent = t.featureTabHistory;
  featureTitleTabUsage.textContent = t.featureTabUsage;
  if (typeof window.tabHistoryApplyTranslations === 'function') {
    window.tabHistoryApplyTranslations();
  }
  if (typeof window.tabUsageApplyTranslations === 'function') {
    window.tabUsageApplyTranslations();
  }
  updateSortSelect();
  updateWindowToggle();
  updateWindowFilter();
  render();
}

/**
 * Collapsible feature panels (tab history, tab usage); tab browser stays always open.
 */
async function initFeaturePanels() {
  const historySection = document.getElementById('panel-tab-history');
  const usageSection = document.getElementById('panel-tab-usage');
  const historyBody = document.getElementById('panel-tab-history-body');
  const usageBody = document.getElementById('panel-tab-usage-body');
  const historyBtn = document.getElementById('toggle-tab-history');
  const usageBtn = document.getElementById('toggle-tab-usage');

  function setExpanded(sectionEl, bodyEl, btnEl, expanded) {
    sectionEl.classList.toggle('collapsed', !expanded);
    bodyEl.hidden = !expanded;
    btnEl.setAttribute('aria-expanded', String(expanded));
  }

  const { panelTabUsageExpanded } = await chrome.storage.local.get(['panelTabUsageExpanded']);

  // Tab history always starts collapsed each time the side panel opens (not persisted).
  setExpanded(historySection, historyBody, historyBtn, false);
  setExpanded(usageSection, usageBody, usageBtn, !!panelTabUsageExpanded);

  historyBtn.addEventListener('click', () => {
    const expand = historyBody.hidden;
    setExpanded(historySection, historyBody, historyBtn, expand);
  });
  const historyIcon = historySection?.querySelector(
    '.feature-panel-head-cluster .feature-panel-icon'
  );
  const historyTitle = document.getElementById('feature-title-tab-history');
  if (historyIcon) historyIcon.addEventListener('click', () => historyBtn.click());
  if (historyTitle) historyTitle.addEventListener('click', () => historyBtn.click());

  usageBtn.addEventListener('click', async () => {
    const expand = usageBody.hidden;
    setExpanded(usageSection, usageBody, usageBtn, expand);
    await chrome.storage.local.set({ panelTabUsageExpanded: expand });
  });
  const usageIcon = usageSection?.querySelector(
    '.feature-panel-head-cluster .feature-panel-icon'
  );
  const usageTitle = document.getElementById('feature-title-tab-usage');
  if (usageIcon) usageIcon.addEventListener('click', () => usageBtn.click());
  if (usageTitle) usageTitle.addEventListener('click', () => usageBtn.click());
}

// Language selector
function initLangSelect() {
  langSelectEl.innerHTML = '';
  for (const lang of getAvailableLanguages()) {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.label;
    langSelectEl.appendChild(opt);
  }
  langSelectEl.value = currentLang;
}

langSelectEl.addEventListener('change', async () => {
  await setLanguage(langSelectEl.value);
  applyTranslations();
});

// Theme management
async function initTheme() {
  const { themePreference } = await chrome.storage.local.get('themePreference');
  if (themePreference === 'light' || themePreference === 'dark') {
    document.documentElement.setAttribute('data-theme', themePreference);
  }
}

themeToggleEl.addEventListener('click', async () => {
  const current = document.documentElement.getAttribute('data-theme');
  const isDark = current === 'dark' ||
    (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  await chrome.storage.local.set({ themePreference: next });
});

/**
 * Syncs the page labels toggle button with `showPageLabels`.
 */
function updateLabelsToggle() {
  if (!labelsToggleEl) return;
  labelsToggleEl.classList.toggle('active', showPageLabels);
  labelsToggleEl.setAttribute('aria-pressed', String(showPageLabels));
  labelsToggleEl.title = showPageLabels ? t.pageLabelsOn : t.pageLabelsOff;
}

// Window grouping toggle
async function initSettings() {
  const { groupByWindowPref, showPageLabelsPref } = await chrome.storage.local.get([
    'groupByWindowPref',
    'showPageLabelsPref',
  ]);
  groupByWindow = groupByWindowPref || false;
  showPageLabels = showPageLabelsPref === true;
  updateWindowToggle();
  updateLabelsToggle();
}

windowToggleEl.addEventListener('click', async () => {
  groupByWindow = !groupByWindow;
  await chrome.storage.local.set({ groupByWindowPref: groupByWindow });
  updateWindowToggle();
  render();
});

labelsToggleEl.addEventListener('click', async () => {
  showPageLabels = !showPageLabels;
  await chrome.storage.local.set({ showPageLabelsPref: showPageLabels });
  updateLabelsToggle();
  render();
});

function updateWindowToggle() {
  windowToggleEl.classList.toggle('active', groupByWindow);
  windowToggleEl.title = groupByWindow ? t.windowGroupingOn : t.windowGroupingOff;
}

// Window filter
windowFilterEl.addEventListener('change', () => {
  const val = windowFilterEl.value;
  filterWindowId = val === 'all' ? null : Number(val);
  render();
});

// Confirmation dialog
let confirmResolve = null;

function showConfirm(message) {
  confirmMessage.textContent = message;
  confirmDialog.classList.remove('hidden');
  return new Promise(resolve => { confirmResolve = resolve; });
}

confirmCancel.addEventListener('click', () => {
  confirmDialog.classList.add('hidden');
  if (confirmResolve) confirmResolve(false);
});

confirmOk.addEventListener('click', () => {
  confirmDialog.classList.add('hidden');
  if (confirmResolve) confirmResolve(true);
});

// Data loading
async function loadTabs() {
  allTabs = await chrome.tabs.query({});
  const { tabPageLabels, customDomainNames: storedNames } = await chrome.storage.local.get(['tabPageLabels', 'customDomainNames']);
  customDomainNames = (storedNames && typeof storedNames === 'object') ? storedNames : {};
  const labelMap = tabPageLabels && typeof tabPageLabels === 'object' ? tabPageLabels : {};
  // Enrich tabs with their group color (query all groups at once for cross-window reliability)
  const groupColorMap = new Map();
  try {
    const allGroups = await chrome.tabGroups.query({});
    for (const g of allGroups) {
      groupColorMap.set(g.id, g.color);
    }
  } catch { /* tabGroups API unavailable */ }
  for (const tab of allTabs) {
    if (tab.groupId !== undefined && tab.groupId !== -1) {
      tab.groupColor = groupColorMap.get(tab.groupId) ?? null;
    }
    const pl = labelMap[String(tab.id)];
    if (pl) {
      tab.pageLabel = pl;
    } else {
      delete tab.pageLabel;
    }
  }
  const tabsWithLabels = allTabs.filter((t) => t.pageLabel).length;
  console.log('[TabManager page-label] sidepanel merge', {
    tabCount: allTabs.length,
    tabsWithStoredLabels: tabsWithLabels,
    storageLabelEntries: Object.keys(labelMap).length,
  });
  updateWindowFilter();
  render();
}

function getDomain(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    if (isLocalAddressHost(hostname) && parsed.port) {
      return hostname + ':' + parsed.port;
    }
    return hostname;
  } catch {
    return 'other';
  }
}

function isIpv4Host(hostname) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false;
  const octets = hostname.split('.').map((o) => Number(o));
  return octets.every((o) => Number.isInteger(o) && o >= 0 && o <= 255);
}

function isIpv6LikeHost(hostname) {
  return hostname.includes(':');
}

function isLocalAddressHost(hostname) {
  const host = (hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/:\d+$/, '');
  if (!host) return false;
  if (host === 'localhost' || host === '::1') return true;

  if (isIpv4Host(host)) {
    const [a, b] = host.split('.').map((o) => Number(o));
    if (a === 10 || a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  }

  // Local IPv6 ranges: loopback (::1), link-local (fe80::/10), unique local (fc00::/7).
  if (isIpv6LikeHost(host)) {
    return host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') ||
      host.startsWith('feb') || host.startsWith('fc') || host.startsWith('fd');
  }

  return false;
}

function getDomainHeaderDisplayName(group) {
  if (!isLocalAddressHost(group.domain)) return group.domain;
  const titledTab = group.tabs.find((tab) => (tab.title || '').trim().length > 0);
  return titledTab ? titledTab.title.trim() : group.domain;
}

function getLocalHostLabelFromTab(tab) {
  try {
    const host = new URL(tab.url || '').hostname;
    return isLocalAddressHost(host) ? host : '';
  } catch {
    return '';
  }
}

function getTabSecondaryLabel(tab) {
  const pageLabel = showPageLabels && tab.pageLabel ? tab.pageLabel : '';
  const localHost = getLocalHostLabelFromTab(tab);
  if (pageLabel && localHost) return `${pageLabel} | ${localHost}`;
  return pageLabel || localHost;
}

function getFaviconUrl(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return '';
  }
}

/**
 * Truncates a string for display in the group label prefix.
 * @param {string} s
 * @param {number} max
 * @returns {string}
 */
function truncateForGroupLabel(s, max) {
  const t = (s || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

/**
 * Whether to show the domain group label block: multiple tabs on this host and labels enabled,
 * with at least one tab carrying a page label. Single-tab groups show the label only on the tab row.
 * @param {object[]} tabs
 * @returns {boolean}
 */
function shouldShowGroupLabelStack(tabs) {
  if (!showPageLabels || tabs.length < 2) return false;
  return tabs.some((tab) => !!tab.pageLabel);
}

// Update window filter dropdown
function updateWindowFilter() {
  const windowIds = [...new Set(allTabs.map(t => t.windowId))];
  const currentValue = windowFilterEl.value;

  windowFilterEl.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = t.allWindows;
  windowFilterEl.appendChild(allOpt);
  windowIds.forEach((wid, i) => {
    const count = allTabs.filter(tab => tab.windowId === wid).length;
    const opt = document.createElement('option');
    opt.value = wid;
    opt.textContent = `${t.windowLabel} ${i + 1} (${count})`;
    windowFilterEl.appendChild(opt);
  });

  if ([...windowFilterEl.options].some(o => o.value === currentValue)) {
    windowFilterEl.value = currentValue;
  } else {
    windowFilterEl.value = 'all';
    filterWindowId = null;
  }

  // Only hide the window dropdown when a single window; keep grouping + labels toggles visible.
  windowFilterEl.style.display = windowIds.length > 1 ? '' : 'none';
}

function tabLastAccessed(tab) {
  return tab.lastAccessed || 0;
}

/**
 * Sorts tabs within one site group according to the current tab sort mode.
 * @param {object[]} domainTabs
 * @param {'titleAsc' | 'titleDesc' | 'timeAsc' | 'timeDesc'} mode
 */
function sortTabsInDomain(domainTabs, mode) {
  const copy = [...domainTabs];
  if (mode === 'titleAsc') {
    copy.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
  } else if (mode === 'titleDesc') {
    copy.sort((a, b) => (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' }));
  } else if (mode === 'timeAsc') {
    copy.sort((a, b) => tabLastAccessed(a) - tabLastAccessed(b));
  } else {
    copy.sort((a, b) => tabLastAccessed(b) - tabLastAccessed(a));
  }
  return copy;
}

/**
 * Orders site groups: by domain name (title modes) or by min/max lastAccessed (time modes).
 * @param {[string, object[]][]} entries
 * @param {'titleAsc' | 'titleDesc' | 'timeAsc' | 'timeDesc'} mode
 */
function sortDomainEntries(entries, mode) {
  const copy = [...entries];
  if (mode === 'titleAsc') {
    copy.sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));
  } else if (mode === 'titleDesc') {
    copy.sort((a, b) => b[0].localeCompare(a[0], undefined, { sensitivity: 'base' }));
  } else if (mode === 'timeAsc') {
    copy.sort((a, b) => {
      const minA = Math.min(...a[1].map(tabLastAccessed));
      const minB = Math.min(...b[1].map(tabLastAccessed));
      return minA - minB;
    });
  } else {
    copy.sort((a, b) => {
      const maxA = Math.max(...a[1].map(tabLastAccessed));
      const maxB = Math.max(...b[1].map(tabLastAccessed));
      return maxB - maxA;
    });
  }
  return copy;
}

// Group tabs by domain
function groupDomains(tabs) {
  const domains = new Map();
  for (const tab of tabs) {
    const domain = getDomain(tab.url || '');
    if (!domains.has(domain)) {
      domains.set(domain, []);
    }
    domains.get(domain).push(tab);
  }

  const entries = [...domains.entries()].map(([domain, domainTabs]) => [
    domain,
    sortTabsInDomain(domainTabs, tabSortMode),
  ]);
  const sortedEntries = sortDomainEntries(entries, tabSortMode);

  return sortedEntries.map(([domain, sortedTabs]) => ({
    domain,
    tabs: sortedTabs,
    favicon: getFaviconUrl(sortedTabs[0].url || ''),
  }));
}

// Rendering
function render() {
  let tabs = filterWindowId ? allTabs.filter(tab => tab.windowId === filterWindowId) : allTabs;

  const totalTabs = tabs.length;
  const totalWindows = new Set(tabs.map(tab => tab.windowId)).size;

  tabCountEl.textContent = t.tabsInWindows(totalTabs, totalWindows);

  tabListEl.innerHTML = '';

  if (totalTabs === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const p = document.createElement('p');
    p.textContent = t.noTabs;
    empty.appendChild(p);
    tabListEl.appendChild(empty);
    return;
  }

  if (groupByWindow && totalWindows > 1) {
    const windows = new Map();
    for (const tab of tabs) {
      if (!windows.has(tab.windowId)) windows.set(tab.windowId, []);
      windows.get(tab.windowId).push(tab);
    }

    let windowIndex = 0;
    for (const [windowId, windowTabs] of windows) {
      windowIndex++;
      const windowHeader = document.createElement('div');
      windowHeader.className = 'window-header';
      windowHeader.textContent = t.windowHeader(windowIndex, windowTabs.length);
      tabListEl.appendChild(windowHeader);

      const domainGroups = groupDomains(windowTabs);
      for (const group of domainGroups) {
        renderDomainGroup(group, windowId);
      }
    }
  } else {
    const domainGroups = groupDomains(tabs);
    for (const group of domainGroups) {
      renderDomainGroup(group, null);
    }
  }

  if (searchEl.value.trim()) {
    applySearch(searchEl.value.trim());
  }
}

function renderDomainGroup(group, windowId) {
  const domainKey = windowId ? `${windowId}:${group.domain}` : `all:${group.domain}`;
  const isExpanded = expandedDomains.has(domainKey);

  const domainEl = document.createElement('div');
  domainEl.className = `domain-group${isExpanded ? ' expanded' : ''}`;
  domainEl.dataset.domainKey = domainKey;

  const showGroupLabel = shouldShowGroupLabelStack(group.tabs);

  const header = document.createElement('div');
  header.className = 'domain-header' + (showGroupLabel ? ' has-domain-label' : '');
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');
  header.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  const arrow = document.createElement('span');
  arrow.className = 'domain-arrow';
  arrow.innerHTML = '&#9654;';
  header.appendChild(arrow);

  if (group.favicon) {
    const img = document.createElement('img');
    img.className = 'domain-favicon';
    img.src = group.favicon;
    img.alt = '';
    header.appendChild(img);
  }

  const nameSpan = document.createElement('span');
  nameSpan.className = 'domain-name';
  const displayName = customDomainNames[group.domain]
    ? getDisplayName(group.domain)
    : getDomainHeaderDisplayName(group);
  nameSpan.textContent = displayName;
  if (customDomainNames[group.domain]) {
    nameSpan.classList.add('has-custom-name');
    nameSpan.title = group.domain;
  } else if (displayName !== group.domain) {
    nameSpan.title = group.domain;
  }

  const renameBtn = document.createElement('button');
  renameBtn.className = 'domain-rename-btn';
  renameBtn.title = t.renameDomain;
  renameBtn.setAttribute('aria-label', t.renameDomain);
  renameBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
  renameBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    enterRenameMode(nameSpan, group.domain, renameBtn);
  });

  const headerText = document.createElement('div');
  headerText.className = 'domain-header-text';
  headerText.appendChild(nameSpan);
  if (showGroupLabel) {
    const stack = document.createElement('div');
    stack.className = 'domain-group-label-stack';
    stack.setAttribute('role', 'group');
    const seenLabels = new Set();
    for (const tab of group.tabs) {
      if (!tab.pageLabel) continue;
      const labelKey = tab.pageLabel.toLowerCase();
      if (seenLabels.has(labelKey)) continue;
      seenLabels.add(labelKey);
      const line = document.createElement('div');
      line.className = 'domain-group-label-line';
      const shortTitle = truncateForGroupLabel(tab.title || 'Untitled', 42);
      line.textContent = `${shortTitle}: ${tab.pageLabel}`;
      stack.appendChild(line);
    }
    headerText.appendChild(stack);
  }
  header.appendChild(headerText);
  header.appendChild(renameBtn);

  const ageSpan = document.createElement('span');
  ageSpan.className = 'domain-age';
  ageSpan.textContent = formatRelativeTime(group.tabs[0].lastAccessed);
  header.appendChild(ageSpan);

  const countSpan = document.createElement('span');
  countSpan.className = 'domain-count';
  countSpan.textContent = group.tabs.length;
  header.appendChild(countSpan);

  const allGrouped = group.tabs.every(tab => tab.groupId !== undefined && tab.groupId !== -1);
  const groupColor = allGrouped
    ? (group.tabs.find(tab => tab.groupColor)?.groupColor ?? null)
    : null;

  if (groupColor) {
    domainEl.classList.add('has-group-color');
    domainEl.style.setProperty('--group-color', `var(--chrome-group-${groupColor})`);
  }

  const groupBtn = document.createElement('button');
  groupBtn.className = 'domain-group-btn' + (allGrouped ? ' is-grouped' : '');
  groupBtn.title = allGrouped ? t.ungroupTabs : t.groupTabs;
  groupBtn.setAttribute('aria-label', allGrouped ? t.ungroupTabs : t.groupTabs);
  groupBtn.innerHTML = allGrouped
    ? '<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/><path d="M7 11h6" stroke="white" stroke-width="1.5" fill="none"/></svg>'
    : '<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>';
  header.appendChild(groupBtn);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'domain-close';
  closeBtn.title = t.closeAll;
  closeBtn.setAttribute('aria-label', t.closeAll);
  closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  header.appendChild(closeBtn);

  header.addEventListener('click', (e) => {
    if (e.target.closest('button, input')) return;
    toggleDomain(domainKey, domainEl, header);
  });

  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('button, input') && e.target !== header) return;
      e.preventDefault();
      toggleDomain(domainKey, domainEl, header);
    }
  });

  header.querySelector('.domain-close').addEventListener('click', async (e) => {
    e.stopPropagation();
    const tabIds = group.tabs.map(tab => tab.id);
    const confirmed = await showConfirm(
      t.confirmCloseAllDomain(group.tabs.length, customDomainNames[group.domain] ? `${customDomainNames[group.domain]} (${group.domain})` : group.domain)
    );
    if (confirmed) {
      await chrome.tabs.remove(tabIds);
    }
  });

  header.querySelector('.domain-group-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    groupOperationInProgress = true;
    try {
      const tabsByWindow = new Map();
      for (const tab of group.tabs) {
        if (!tabsByWindow.has(tab.windowId)) tabsByWindow.set(tab.windowId, []);
        tabsByWindow.get(tab.windowId).push(tab.id);
      }
      const windowEntries = [...tabsByWindow.entries()];
      if (allGrouped) {
        await Promise.all(windowEntries.map(([, tabIds]) => chrome.tabs.ungroup(tabIds)));
      } else {
        await Promise.all(windowEntries.map(async ([windowId, tabIds]) => {
          const groupId = await chrome.tabs.group({
            createProperties: { windowId },
            tabIds,
          });
          await chrome.tabGroups.update(groupId, {
            title: getDisplayName(group.domain),
            color: pickGroupColor(group.domain),
          });
        }));
      }
    } finally {
      groupOperationInProgress = false;
    }
    await loadTabs();
  });

  domainEl.appendChild(header);

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'domain-tabs';

  for (const tab of group.tabs) {
    const tabSecondaryLabel = getTabSecondaryLabel(tab);
    const tabEl = document.createElement('div');
    tabEl.className = 'tab-entry' + (tabSecondaryLabel ? ' has-tab-label' : '');
    tabEl.dataset.tabId = tab.id;
    tabEl.setAttribute('role', 'button');
    tabEl.setAttribute('tabindex', '0');
    const pl = (tab.pageLabel || '').toLowerCase();
    tabEl.dataset.searchText = `${(tab.title || '').toLowerCase()} ${(tab.url || '').toLowerCase()} ${pl} ${getDisplayName(group.domain).toLowerCase()}`;

    const isActive = tab.active;

    const dot = document.createElement('div');
    dot.className = 'tab-active-dot' + (isActive ? '' : ' inactive');
    tabEl.appendChild(dot);

    const titleWrap = document.createElement('div');
    titleWrap.className = 'tab-title-wrap';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title' + (isActive ? '' : ' inactive-tab');
    titleSpan.textContent = tab.title || 'Untitled';
    titleWrap.appendChild(titleSpan);

    if (tabSecondaryLabel) {
      const pageLabelEl = document.createElement('span');
      pageLabelEl.className = 'tab-page-label';
      pageLabelEl.textContent = tabSecondaryLabel;
      titleWrap.appendChild(pageLabelEl);
    }

    tabEl.appendChild(titleWrap);

    const tabAge = document.createElement('span');
    tabAge.className = 'tab-age';
    tabAge.textContent = formatRelativeTime(tab.lastAccessed);
    tabEl.appendChild(tabAge);

    const tabCloseBtn = document.createElement('button');
    tabCloseBtn.className = 'tab-close';
    tabCloseBtn.title = t.closeTab;
    tabCloseBtn.setAttribute('aria-label', t.closeTab);
    tabCloseBtn.innerHTML = '&times;';
    tabEl.appendChild(tabCloseBtn);

    tabEl.addEventListener('click', (e) => {
      if (e.target.closest('button, input')) return;
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    });

    tabEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('button, input') && e.target !== tabEl) return;
        e.preventDefault();
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }
    });

    tabEl.querySelector('.tab-close').addEventListener('click', async (e) => {
      e.stopPropagation();
      await chrome.tabs.remove(tab.id);
    });

    tabsContainer.appendChild(tabEl);
  }

  domainEl.appendChild(tabsContainer);
  tabListEl.appendChild(domainEl);
}

function toggleDomain(key, el, headerEl) {
  if (expandedDomains.has(key)) {
    expandedDomains.delete(key);
    el.classList.remove('expanded');
    if (headerEl) headerEl.setAttribute('aria-expanded', 'false');
  } else {
    expandedDomains.add(key);
    el.classList.add('expanded');
    if (headerEl) headerEl.setAttribute('aria-expanded', 'true');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Rename domain
function enterRenameMode(nameSpan, domain, renameBtn) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'domain-rename-input';
  input.value = getDisplayName(domain);
  input.setAttribute('aria-label', t.renameDomainInputAria);
  nameSpan.replaceWith(input);
  renameBtn.style.display = 'none';
  input.focus();
  input.select();

  let committed = false;
  const commit = async () => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    await setCustomDomainName(domain, newName);
    await syncTabGroupTitle(domain);
    loadTabs();
  };
  const cancel = () => {
    if (committed) return;
    committed = true;
    loadTabs();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', commit);
}

async function syncTabGroupTitle(domain) {
  try {
    const allGroups = await chrome.tabGroups.query({});
    const displayName = getDisplayName(domain);
    for (const g of allGroups) {
      if (g.title === domain || g.title === customDomainNames[domain] || g.title === displayName) {
        await chrome.tabGroups.update(g.id, { title: displayName });
      }
    }
  } catch { /* tabGroups API unavailable */ }
}

// Search
searchEl.addEventListener('input', () => {
  const query = searchEl.value.trim();
  if (!query) {
    tabListEl.classList.remove('searching');
    document.querySelectorAll('.tab-entry').forEach(el => el.classList.remove('match'));
    document.querySelectorAll('.domain-group').forEach(el => el.classList.remove('has-match'));
    return;
  }
  applySearch(query);
});

function applySearch(query) {
  const q = query.toLowerCase();
  tabListEl.classList.add('searching');

  document.querySelectorAll('.domain-group').forEach(groupEl => {
    let hasMatch = false;
    groupEl.querySelectorAll('.tab-entry').forEach(tabEl => {
      const matches = tabEl.dataset.searchText.includes(q);
      tabEl.classList.toggle('match', matches);
      if (matches) hasMatch = true;
    });
    groupEl.classList.toggle('has-match', hasMatch);
  });
}

// Close old tabs
closeOldEl.addEventListener('click', async () => {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const allCurrentTabs = await chrome.tabs.query({});

  const oldTabs = allCurrentTabs.filter(tab => {
    if (tab.active) return false;
    if (tab.lastAccessed && tab.lastAccessed < sevenDaysAgo) return true;
    return false;
  });

  if (oldTabs.length === 0) {
    await showConfirm(t.noOldTabs);
    return;
  }

  const confirmed = await showConfirm(t.confirmCloseOld(oldTabs.length));
  if (confirmed) {
    await chrome.tabs.remove(oldTabs.map(tab => tab.id));
  }
});

function updateSortSelect() {
  tabSortSelectEl.value = tabSortMode;
}

async function initTabSortSettings() {
  const { tabSortMode: stored } = await chrome.storage.local.get('tabSortMode');
  if (stored && ['titleAsc', 'titleDesc', 'timeAsc', 'timeDesc'].includes(stored)) {
    tabSortMode = stored;
  }
  updateSortSelect();
}

tabSortSelectEl.addEventListener('change', async () => {
  const mode = tabSortSelectEl.value;
  if (!['titleAsc', 'titleDesc', 'timeAsc', 'timeDesc'].includes(mode)) return;
  tabSortMode = mode;
  await chrome.storage.local.set({ tabSortMode });
  render();
});

/**
 * When merging duplicate site tabs, keep the active tab if any, else the most recently accessed.
 * @param {object[]} tabs
 */
function pickTabToKeep(tabs) {
  const active = tabs.find((t) => t.active);
  if (active) return active;
  return tabs.reduce((best, t) => (tabLastAccessed(t) > tabLastAccessed(best) ? t : best), tabs[0]);
}

/**
 * Closes extra tabs per hostname so only one tab remains per site (current window filter applies).
 */
async function mergeSameSites() {
  const tabs = filterWindowId ? allTabs.filter((tab) => tab.windowId === filterWindowId) : allTabs;
  const byDomain = new Map();
  for (const tab of tabs) {
    const d = getDomain(tab.url || '');
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d).push(tab);
  }
  const toClose = [];
  for (const [, list] of byDomain) {
    if (list.length < 2) continue;
    const keep = pickTabToKeep(list);
    for (const t of list) {
      if (t.id !== keep.id) toClose.push(t.id);
    }
  }
  if (toClose.length === 0) {
    await showConfirm(t.noDuplicatesToMerge);
    return;
  }
  const confirmed = await showConfirm(t.confirmMergeDuplicates(toClose.length));
  if (confirmed) {
    await chrome.tabs.remove(toClose);
  }
}

mergeSameSitesBtn.addEventListener('click', () => mergeSameSites());

// Banner settings
function updateBannerButtons(side, visible) {
  bannerLeftBtn.classList.toggle('active', visible && side === 'left');
  bannerRightBtn.classList.toggle('active', visible && side === 'right');
  bannerOffBtn.classList.toggle('active', !visible);
}

async function initBannerSettings() {
  const { bannerSide, bannerVisible } = await chrome.storage.local.get(['bannerSide', 'bannerVisible']);
  const side = bannerSide || 'right';
  const visible = bannerVisible !== false;
  updateBannerButtons(side, visible);
}

bannerLeftBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ bannerSide: 'left', bannerVisible: true });
  updateBannerButtons('left', true);
});

bannerRightBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ bannerSide: 'right', bannerVisible: true });
  updateBannerButtons('right', true);
});

bannerOffBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ bannerVisible: false });
  updateBannerButtons('right', false);
});

// Register with background so it knows the panel is open
const panelPort = chrome.runtime.connect({ name: 'sidepanel' });
panelPort.onMessage.addListener((msg) => {
  if (msg.type === 'close') {
    window.close();
  }
});

// Listen for tab changes from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'tabs-changed' && !groupOperationInProgress) {
    loadTabs();
  }
});

// Refresh when HTML head labels are updated (content script → storage)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || groupOperationInProgress) return;
  if (!changes.tabPageLabels && !changes.customDomainNames) return;
  if (document.querySelector('.domain-rename-input')) return;
  loadTabs();
});

// Refresh tab data when panel becomes visible (e.g. window switch, panel reopen)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !groupOperationInProgress) {
    loadTabs();
  }
});

// Initialize
async function init() {
  await initI18n();
  initLangSelect();
  await initTheme();
  await initSettings();
  await initFeaturePanels();
  await initTabSortSettings();
  await initBannerSettings();
  initTabHistory();
  initTabUsage();
  applyTranslations();
  await loadTabs();
}

init();

// Auto-expand the first domain group on initial load
const observer = new MutationObserver(() => {
  const firstGroup = tabListEl.querySelector('.domain-group:not(.expanded)');
  if (firstGroup && expandedDomains.size === 0) {
    const key = firstGroup.dataset.domainKey;
    expandedDomains.add(key);
    firstGroup.classList.add('expanded');
    observer.disconnect();
  }
});
observer.observe(tabListEl, { childList: true });
