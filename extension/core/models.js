/**
 * Shared domain models and JSDoc typedefs for extension data.
 * Loaded where needed via extra script tags or referenced for typing only.
 */

/**
 * Tab as used in the side panel after enrichment (e.g. Chrome group color).
 * @typedef {Object} EnrichedTab
 * @property {number} id
 * @property {number} windowId
 * @property {string} [title]
 * @property {string} [url]
 * @property {number} [lastAccessed]
 * @property {boolean} [active]
 * @property {number} [groupId]
 * @property {chrome.tabGroups.Color | null} [groupColor]
 * @property {string} [pageLabel] HTML head-derived label (Open Graph, meta description, etc.)
 */

/**
 * Domain grouping bucket for rendering.
 * @typedef {Object} DomainGroup
 * @property {string} domain
 * @property {EnrichedTab[]} tabs
 * @property {string} favicon
 */
