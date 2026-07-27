## Exploration: pwa-share-target

### Current State
- TaPeer is a lightweight Web App with backend functionality served in `server.js` and frontend assets in `public/index.html`, `public/app.js`, and `public/style.css`.
- It currently does not have a Web App Manifest, Service Worker, or PWA features configured.
- The Clipboard History renders text snippets by escaping all HTML, showing them as plain, non-clickable text even if they contain valid URLs.
- The styling has a consistent earth/jungle theme, but there is no specific styling for hyperlink elements.

### Affected Areas
- [public/index.html](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/index.html) — Add PWA manifest link (`manifest.json`) and theme-color meta tag.
- [public/app.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/app.js) — Implement Service Worker registration, extract/digest incoming share parameters on load, clear query params via History API, post the digest asynchronously to `text`, and implement a secure, XSS-safe linkification function (`safeLinkify`) to display clickable links in Clipboard History.
- [public/style.css](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/style.css) — Add styling for `.jungle-link` links to match the light and dark jungle themes.
- **New File**: `public/manifest.json` — PWA configuration with Web Share Target mapping share actions (title, text, url) to `./` via `GET`.
- **New File**: `public/sw.js` — Service Worker caching static assets and resolving offline fetches, matching `/` queries using `ignoreSearch: true`.
- **New File**: `public/icon.svg` — Scalable SVG icon based on the Tapir mascot for PWA installation.

### Approaches

#### 1. Share Target Integration

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **Option A: GET-based Share Target (Action: `./`, Method: `GET`)** <br>*(Recommended)* | 1. Highly portable (works under `/` or subpaths like `/tapeer/`).<br>2. Zero changes needed in `server.js` route handlers.<br>3. Easy parsing on page load via `URLSearchParams`. | 1. Subject to query string URL length limitations (not a concern for text snippet links). | Low/Medium |
| **Option B: POST-based Share Target (Action: `/share-text`, Method: `POST`)** | 1. Can handle larger payload sizes. | 1. Requires custom routing in `server.js` to process incoming POST redirects.<br>2. Higher architectural coupling between PWA and Express server.<br>3. Difficult to coordinate cleanly under dynamic proxy subpaths. | High |

#### 2. Safe Linkification

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **Option A: Escape-first, Tokenize-second Regex parser** <br>*(Recommended)* | 1. 100% XSS-Safe. HTML content is escaped *before* wrapping matched URLs in tags.<br>2. Cleanly separates trailing punctuation (periods, parentheses) from the URL.<br>3. No raw HTML markup can slip through. | 1. Requires careful Regex bounds to prevent matching escaped entity sequences (e.g. `&quot;`). | Low |
| **Option B: Third-party Linkification Library** | 1. Handles edge cases out-of-the-box. | 1. Adds external dependency or increases JS bundle footprint.<br>2. Requires audit of library to ensure strict XSS protection. | Low |

### Recommendation
- **Share Target**: Use **Option A (GET-based)**. It is elegant, encapsulates logic on the client side, and doesn't pollute the backend server configuration.
- **Safe Linkification**: Use **Option A (Tokenize-second)**. Writing a lightweight, tailored tokenization-escape parser guarantees absolute protection from XSS without needing external dependencies.

### Risks
- **Duplicate Submissions**: Reloading the page with sharing query parameters still in the address bar will cause duplicate posts to the backend.
  - *Mitigation*: Immediately run `window.history.replaceState({}, document.title, window.location.pathname)` on startup to wipe parameters before initiating the POST request.
- **XSS Injection**: A malicious URL containing payload attributes or utilizing the `javascript:` scheme could lead to script execution if rendered dynamically.
  - *Mitigation*: Ensure the regex only matches `http://` or `https://` protocols, does not allow quotes/brackets inside the URL matching group, and HTML-escapes all other text segments.
- **Subpath Support**: When hosted under subpaths (e.g. `/tapeer/`), absolute paths like `/sw.js` or `/manifest.json` will look in the wrong directory.
  - *Mitigation*: Use relative registrations (`sw.js` and `manifest.json`) and configure `start_url` and `share_target.action` to `.` / `./`.

### Ready for Proposal
Yes — We have a solid architectural plan that meets all requirements safely and cleanly.
