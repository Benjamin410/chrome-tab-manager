## Bolt's Journal

## 2026-03-31 - Initial Render Performance
**Learning:** For rendering hundreds of tabs in the side panel, direct DOM insertion of `div` elements caused significant layout thrashing. Creating favicons without lazy loading also blocked the main thread as Chrome fetched them all synchronously.
**Action:** Always batch DOM insertions in a `DocumentFragment` inside `render()` loops, and ensure native `loading="lazy"` is used on dynamically generated list item images like favicons.
