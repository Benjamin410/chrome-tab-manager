/**
 * Reads well-known HTML meta tags and sends one searchable label string.
 * Scans the whole document (meta sometimes appears outside <head>), decodes entities,
 * retries after load and on head mutations so SPAs / late-injected tags are captured.
 */
(() => {
  const LOG_PREFIX = '[TabManager page-label]';

  /** @type {number} Upper bound for stored label length (storage + UI). */
  const MAX_LABEL_LENGTH = 8000;

  /** Max times we send an updated label (MutationObserver + retries). */
  const MAX_SENDS = 12;

  /** @typedef {'none' | 'bullet' | 'comma'} FragmentMode */

  /**
   * @type {{ type: 'name' | 'property', key: string, multi?: boolean, fragments?: FragmentMode }[]}
   */
  const META_RULES = [
    { type: 'name', key: 'description', fragments: 'bullet' },
    { type: 'name', key: 'keywords', fragments: 'comma' },
    { type: 'name', key: 'author' },
    { type: 'property', key: 'og:title' },
    { type: 'property', key: 'og:description', fragments: 'bullet' },
    { type: 'property', key: 'og:type' },
    { type: 'property', key: 'og:site_name' },
    { type: 'property', key: 'og:tag' },
    { type: 'property', key: 'article:tag', multi: true },
    { type: 'property', key: 'article:section' },
    { type: 'property', key: 'article:published_time' },
    { type: 'property', key: 'article:author' },
  ];

  /**
   * Decodes HTML entities in attribute values (&nbsp;, &amp;, etc.).
   * @param {string} str
   * @returns {string}
   */
  function decodeHtmlEntities(str) {
    if (!str) return '';
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(str, 'text/html');
      return doc.documentElement.textContent;
    } catch (e) {
      console.warn(`${LOG_PREFIX} decodeHtmlEntities failed`, e);
      return str;
    }
  }

  function normalize(s) {
    return s.replace(/\s+/g, ' ').trim();
  }

  function preview(s, max) {
    const t = (s || '').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  }

  /**
   * Bullet-style descriptions: • · | – (en dash). Avoid plain hyphen to limit word splits.
   * @param {string} decoded
   * @param {FragmentMode} mode
   * @returns {string[]}
   */
  function expandFragments(decoded, mode) {
    if (!decoded) return [];
    if (mode === 'bullet') {
      return decoded
        .split(/\s*[•·|]\s*|\s*[–—]\s*/)
        .map((s) => normalize(s))
        .filter(Boolean);
    }
    if (mode === 'comma') {
      return decoded
        .split(',')
        .map((s) => normalize(s))
        .filter(Boolean);
    }
    const one = normalize(decoded);
    return one ? [one] : [];
  }

  function metaSelector(type, key) {
    if (type === 'name') return `meta[name="${key}"]`;
    return `meta[property="${key}"]`;
  }

  /**
   * Use full document — meta is only valid in head per spec, but many sites inject late or in body.
   * @returns {ParentNode}
   */
  function queryRoot() {
    return document.documentElement || document.body || document;
  }

  /**
   * @returns {{ label: string, extraction: object }}
   */
  function extractPageLabel() {
    const seen = new Set();
    const parts = [];

    function add(s) {
      const n = normalize(s);
      if (!n || seen.has(n)) return;
      seen.add(n);
      parts.push(n);
    }

    const url = typeof location !== 'undefined' ? location.href : '';
    const root = queryRoot();

    const ruleChecks = [];

    for (const rule of META_RULES) {
      const sel = metaSelector(rule.type, rule.key);
      const label = `meta[${rule.type}="${rule.key}"]${rule.multi ? ' (all)' : ''}`;
      const fragmentMode = rule.fragments || 'none';
      const nodes = rule.multi ? root.querySelectorAll(sel) : (() => {
        const one = root.querySelector(sel);
        return one ? [one] : [];
      })();

      const valuesAdded = [];
      const previews = [];

      for (const node of nodes) {
        const raw = node.getAttribute('content');
        if (raw == null || !String(raw).trim()) continue;
        const decoded = decodeHtmlEntities(String(raw));
        const frags = expandFragments(decoded, fragmentMode);
        for (const frag of frags) {
          const before = parts.length;
          add(frag);
          if (parts.length > before) {
            valuesAdded.push(frag);
            previews.push(preview(frag, 120));
          }
        }
      }

      ruleChecks.push({
        checked: label,
        selector: sel,
        multi: !!rule.multi,
        fragments: fragmentMode,
        nodesInDom: nodes.length,
        fragmentsAdded: valuesAdded.length,
        found: valuesAdded.length > 0,
        contentPreviews: previews,
      });
    }

    const documentTitle = document.title || '';
    const titleDecoded = decodeHtmlEntities(documentTitle);
    if (normalize(titleDecoded)) {
      add(titleDecoded);
    }

    let joined = parts.join(' ');
    let truncated = false;
    if (joined.length > MAX_LABEL_LENGTH) {
      truncated = true;
      joined = joined.slice(0, MAX_LABEL_LENGTH);
    }

    return {
      label: joined,
      extraction: {
        url,
        allowlistRuleCount: META_RULES.length,
        ruleChecks,
        documentTitle,
        titleIncludedInLabel: normalize(titleDecoded) && parts.includes(normalize(titleDecoded)),
        uniquePartsAfterDedupe: parts.length,
        finalLength: joined.length,
        truncated,
      },
    };
  }

  let sendCount = 0;
  /** @type {string | undefined} */
  let lastSent;

  /**
   * Sends label to service worker; logs chrome.runtime.lastError on failure.
   * @param {string} reason
   */
  function sendLabel(reason) {
    if (sendCount >= MAX_SENDS) return;
    let label = '';
    let extraction = { ruleChecks: [] };
    try {
      const out = extractPageLabel();
      label = out.label;
      extraction = out.extraction;
    } catch (e) {
      console.error(`${LOG_PREFIX} extractPageLabel failed`, e);
      return;
    }

    if (label === lastSent) return;
    lastSent = label;
    sendCount += 1;

    if (sendCount === 1) {
      console.log(`${LOG_PREFIX} allowlist rules (${extraction.allowlistRuleCount})`, extraction.ruleChecks);
      console.log(`${LOG_PREFIX} summary`, {
        url: extraction.url,
        documentTitle: extraction.documentTitle,
        rulesWithAtLeastOneValue: extraction.ruleChecks.filter((r) => r.found).length,
        uniqueParts: extraction.uniquePartsAfterDedupe,
        finalLabelLength: extraction.finalLength,
        labelPreview: preview(label, 200),
      });
    }

    chrome.runtime.sendMessage({ type: 'tab-page-label', label }, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.error(`${LOG_PREFIX} sendMessage failed`, reason, err.message);
        return;
      }
      console.log(`${LOG_PREFIX} sent (${reason})`, {
        length: label.length,
        preview: preview(label, 160),
        rulesWithMatches: extraction.ruleChecks.filter((r) => r.found).length,
      });
    });
  }

  try {
    sendLabel('immediate');

    const delays = [300, 1200, 3000];
    for (const ms of delays) {
      setTimeout(() => sendLabel(`retry+${ms}ms`), ms);
    }

    const head = document.head;
    if (head && typeof MutationObserver !== 'undefined') {
      let debounceTimer = null;
      const obs = new MutationObserver(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => sendLabel('head-mutation'), 150);
      });
      obs.observe(head, { childList: true, subtree: true, attributes: true, attributeFilter: ['content'] });
    }
  } catch (e) {
    console.error(`${LOG_PREFIX} bootstrap failed`, e);
  }
})();
