## Exploration: history-and-theme-switch

### Current State
Currently, TaPeer supports uploading files and sharing text snippets. However, it lacks:
- A route to retrieve active shares.
- A user-facing list showing recently shared items.
- A dark mode theme option for nighttime usage.
- Responsiveness adjustments for mobile screens where elements like the mascot SVG can cause overflow or look excessively large.

### Affected Areas
- [server.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/server.js) — To implement `GET /items` to read `uploads/` metadata, check expirations, and fetch snippet contents.
- [public/index.html](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/index.html) — To integrate the history section layout, the theme switch toggle button, and any layout structural adjustments.
- [public/style.css](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/style.css) — To add CSS variables, dark mode styling overrides (`body.dark-mode`), layout overflow protection (`overflow-x: hidden`), and responsive scaling for the mascot.
- [public/app.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/app.js) — To implement history fetching/rendering, 150-char truncation, dynamic expand/collapse toggles, the copy button helper, and theme state toggling/localStorage caching.

### Approaches

#### 1. Server Route `GET /items`
- **Option A: On-Demand Scan (Recommended)**
  On every `GET /items` request, scan `uploads/` for files ending in `-meta.json`. Parse each file, filter out expired entries (`expiryTime <= Date.now()`), read matching `${id}-snippet.txt` files for text snippets, sort descending by `uploadTime`, and slice the top 10.
  - Pros: Clean, stateless, always accurate, self-cleaning/correcting.
  - Cons: Requires multi-file disk I/O on every call.
  - Effort: Low
- **Option B: In-Memory Cache Store**
  Initialize an in-memory array of active metadata on server start and update it upon new uploads/expirations.
  - Pros: Fast response times with minimal disk I/O.
  - Cons: Resets on server restarts; creates multi-process consistency challenges if run in clustered environments.
  - Effort: Medium

#### 2. Client-Side History Rendering and State Retention
- **Option A: Local State Persistence (Recommended)**
  Keep track of currently expanded snippet IDs in a local `Set`. When the list updates every 5 seconds or via manual toggles, redraw the UI using the cached or polled list while maintaining the expanded/collapsed state based on the `Set`'s IDs. Toggling "Expand/Collapse" runs instantly by changing the state and triggering a redraw without a network call.
  - Pros: Instant expand/collapse reaction, seamless 5-second polling updates without collapsing open previews.
  - Cons: Slightly more code logic to manage state.
  - Effort: Medium
- **Option B: Naive List Redraw**
  Wipe and redraw the entire history DOM block on every poll event, ignoring toggle state.
  - Pros: Simplest implementation.
  - Cons: Terrible UX—if the user is reading or copying an expanded snippet, it will collapse back to 150 characters every 5 seconds.
  - Effort: Low

#### 3. Light/Dark Mode Styling
- **Option A: CSS Custom Variables Theme (Recommended)**
  Define color variables on `body` (e.g. `--bg-color`, `--text-color`, `--card-bg`, etc.) and override them under `body.dark-mode`. Update all card, input, speech bubble, and secondary button selectors to use these variables. Use `localStorage` in JS to set `body.classList.add('dark-mode')` on initial load.
  - Pros: Ultra-clean CSS code; instantaneous theme transitions; full visual integration for complex elements like gradients and speech bubble arrows.
  - Cons: Requires refactoring some hardcoded hex codes in the existing CSS file.
  - Effort: Medium
- **Option B: Inline Styles or Monolithic Selectors**
  Write a separate block of rules like `body.dark-mode .card { ... }` repeating styles for every component.
  - Pros: No initial CSS variable conversion needed.
  - Cons: Fragile CSS structure, hard to maintain, and prone to visual bugs.
  - Effort: Low

### Recommendation
1. Use **Option A for Route `/items`** as TaPeer's uploads naturally expire and are deleted within 24 hours, keeping directory sizes small and disk I/O lightweight.
2. Use **Option A for History Rendering** to avoid UI disruption during background polling.
3. Use **Option A for Theme Switch** to establish a clean CSS architecture using CSS variables.

### Risks
- **File I/O Race Conditions:** When reading `${id}-snippet.txt` inside the route, the file could be deleted by the background clean-up script between the time the directory list is read and the file is read.
  - *Mitigation:* Wrap `fs.readFile()` for the snippet file in a `try-catch` block and gracefully return an empty string or omit the item if it cannot be read.
- **Polling Noise:** Polling every 5 seconds makes 720 requests per hour per open tab.
  - *Mitigation:* Ensure `GET /items` handles request errors cleanly and set up a reasonable cache header or optimize file parsing.

### Ready for Proposal
Yes — I am ready to propose the implementation plan to the user.
