# Tasks: History and Theme Switch

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120-180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend API Integration | PR 1 | Implement GET /items endpoint to fetch and sort active items. |
| 2 | CSS Variable Refactoring & Dark Theme | PR 1 | Refactor style.css for CSS variables and add dark-mode styling. |
| 3 | Frontend Theme Toggle & Persistent Storage | PR 1 | Add theme switch UI/logic, localStorage persistence, and page load hook. |
| 4 | Frontend Clipboard History Rendering | PR 1 | Fetch and poll /items, render history list, handle snippets & toggle state. |
| 5 | Mobile Responsiveness & Mascot Scaling | PR 1 | Implement container layout fixes and mascot scaling via media queries. |
| 6 | Verification and Verification Testing | PR 1 | Update testing scripts and verify all states manually. |

## Phase 1: Backend Integration

- [x] 1.1 In `server.js`, implement the `GET /items` endpoint.
- [x] 1.2 Scan the `uploads/` directory for `<uuid>-meta.json` files using `fs.readdir()`.
- [x] 1.3 Filter out expired uploads by comparing `expiryTime` with `Date.now()`.
- [x] 1.4 Read snippet files (`*-snippet.txt`) for text items and populate the `content` property. Wrap in `try/catch` to handle I/O race conditions.
- [x] 1.5 Sort items descending by `uploadTime`, limit to top 10 active items, and return 200 with the JSON array.

## Phase 2: Theme Setup & Responsive Layout

- [x] 2.1 Refactor `public/style.css` to use CSS custom properties on `:root` for main background, text color, card styles, and buttons.
- [x] 2.2 Define `body.dark-mode` overrides in `public/style.css` matching deep jungle colors (background: `#0c1a13`, cards: `#142d20`, border: `#1d4d36`, text: `#F4F0EA`).
- [x] 2.3 Add responsive layout rules (`max-width: 100%` and `box-sizing: border-box`) on the container and cards to resolve horizontal scroll issues.
- [x] 2.4 Add a CSS media query to scale down the tapir mascot SVG on viewport widths below 480px.

## Phase 3: Frontend Feature Integration

- [x] 3.1 In `public/index.html`, add a theme toggle button inside the header and a clipboard history container inside the main layout.
- [x] 3.2 In `public/app.js`, add a click listener to the theme toggle button that toggles `body.dark-mode` and saves `"dark"` or `"light"` in `localStorage`.
- [x] 3.3 Apply the stored theme choice from `localStorage` immediately on page load to prevent flash of light theme.
- [x] 3.4 In `public/app.js`, implement `fetchHistory()` to fetch from `GET /items` and render the clipboard history list.
- [x] 3.5 Set up 5-second interval polling for `fetchHistory()`.
- [x] 3.6 Maintain expanded card IDs in a local `Set` to prevent polling refreshes from collapsing active cards.
- [x] 3.7 Render text snippet cards with a 150-char preview, a "Show More" / "Show Less" toggle button, and a "Copy" button.
- [x] 3.8 Render file cards with the original filename, formatted size, and a download button/link. Show "No shared items yet" if history is empty.

## Phase 4: Verification / Testing

- [x] 4.1 Update or create a test script to check `GET /items` filters expired files and returns correct metadata/snippet JSON structure.
- [x] 4.2 Validate persistent dark/light theme toggle, ensuring theme persists on page reload.
- [x] 4.3 Manually verify 5-second history refresh preserves expanded text snippets and copy-to-clipboard functionality.
- [x] 4.4 Verify mobile viewport rendering (no horizontal scrollbar and scaled down mascot) on small screen sizes.
