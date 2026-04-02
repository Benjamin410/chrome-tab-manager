## 2024-04-01 - DOM Batching in Sidepanel rendering
**Learning:** The `render()` function in `sidepanel.js` previously manipulated the DOM synchronously in loops, appending `domainEl` individually which caused layout thrashing as the tab list grew.
**Action:** Use `DocumentFragment` to batch component insertions during the tab list render cycle, minimizing repaint/reflow cycles to a single operation at the end of `render()`.
