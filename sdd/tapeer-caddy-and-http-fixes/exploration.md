## Exploration: tapeer-caddy-and-http-fixes

### Current State
- The frontend code in `public/app.js` uses absolute URLs like `/upload`, `/items`, and `/text` for API calls, and `/download/${item.id}` in the history list. When hosted under a reverse proxied subpath like `/tapeer/`, these paths point to the root domain instead of the subpath.
- The clipboard copy functions (`copyBtn` listener and `copyToClipboard` function) rely exclusively on `navigator.clipboard.writeText`, which is disabled by browsers in non-secure HTTP contexts (such as Tailscale or local networks without HTTPS). This leaves users unable to copy links.
- When an item is successfully shared, `handleSuccess` automatically scrolls the page to the `resultsContainer`. This hides the tapir mascot animations at the top.
- The hosting structure lacks a reverse proxy configuration to serve multiple apps (such as TaPeer under `/tapeer/`) and a root landing dashboard.

### Affected Areas
- [public/app.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/app.js) — Modify API fetch calls to use relative paths (`upload`, `items`, `text`); adjust item action links to use `download/` and `snippet/`; update `handleSuccess` to construct `fullUrl` relative to the current location and remove `resultsContainer.scrollIntoView`; implement a unified copy-to-clipboard helper with fallback.
- [sdd/tapeer-caddy-and-http-fixes/Caddyfile](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/sdd/tapeer-caddy-and-http-fixes/Caddyfile) — Draft Caddy reverse proxy and landing page configuration.
- [sdd/tapeer-caddy-and-http-fixes/dashboard/index.html](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/sdd/tapeer-caddy-and-http-fixes/dashboard/index.html) — Draft a landing page dashboard.

### Approaches

#### 1. Relative Paths implementation in `public/app.js`
- **Option A: Relative Path fetch & dynamic URL construction (Recommended)**
  Replace `/upload`, `/items`, `/text` with `upload`, `items`, `text` directly. In `handleSuccess`, strip the leading slash from the returned `url` (e.g. `/download/...` to `download/...`) and resolve it using `new URL(relativeUrl, base)` where `base` is the current page's parent directory:
  `const base = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);`
  For history links, use `download/${item.id}` and `snippet/${item.id}`.
  - Pros: 100% robust under any subpath, doesn't require modifying the backend return values, and automatically resolves correctly whether index.html is present or not.
  - Cons: Requires minor string parsing of the returned URLs from the server.
  - Effort: Low
- **Option B: Dynamic Root Path Detection**
  Inspect `window.location.pathname` to construct a base path prefix (e.g., `/tapeer/`) and prepend it to all requests.
  - Pros: Explicitly manages the prefix.
  - Cons: More complex regex/string parsing, easily breaks if directory routing/rewriting changes.
  - Effort: Medium

#### 2. HTTP Copy Fallback
- **Option A: Unified Promise-Based Clipboard Helper (Recommended)**
  Create a helper function `copyText(text)` that returns a Promise. If `navigator.clipboard` is available, call it; otherwise, fall back to using a temporary `<textarea>` element, `document.body.appendChild()`, `select()`, and `document.execCommand('copy')`.
  - Pros: Maintains API compatibility with existing `.then()` and `.catch()` chains in the caller, works seamlessly on both HTTP (non-secure Tailscale) and HTTPS.
  - Cons: None.
  - Effort: Low
- **Option B: Try/Catch wrapper on callers**
  Wrap each caller in a try-catch and execute the fallback inline.
  - Pros: No helper function needed.
  - Cons: Code duplication between the share link copy button and the history list snippet copy buttons.
  - Effort: Low

#### 3. Automatic Scroll Removal
- **Option A: Remove `scrollIntoView()` (Recommended)**
  Simply delete `resultsContainer.scrollIntoView({ behavior: 'smooth' });` from `handleSuccess`.
  - Pros: Simplest fix, allows the mascot animations to be visible after successful uploads.
  - Cons: None.
  - Effort: Low

#### 4. Caddy & Dashboard Configuration
- **Option A: handle_path reverse proxy (Recommended)**
  Define a Caddyfile using `handle_path /tapeer/*` to reverse proxy to `localhost:3000` (stripping `/tapeer` prefix) and a fallback `handle` block to serve the dashboard statically via `file_server`. Add a redirect `redir /tapeer /tapeer/` to ensure relative paths resolve correctly.
  - Pros: Fully handles routing, prefix stripping, and trailing slash redirection cleanly.
  - Cons: Requires placing dashboard static files in a specific directory.
  - Effort: Low

### Recommendation
- Use **Option A** for all requirements. They represent the cleanest and most standard implementations that resolve the pathing issues, HTTP clipboard limitations, scroll disruption, and reverse proxy hosting.

### Risks
- **Trailing Slashes**: If the user visits `http://server/tapeer` without a trailing slash, relative fetches will resolve to `http://server/upload` instead of `http://server/tapeer/upload`.
  - *Mitigation*: The drafted Caddyfile includes an explicit redirect `redir /tapeer /tapeer/` which guarantees that the browser always has the correct path context.

### Ready for Proposal
Yes — I am ready to propose this implementation.
