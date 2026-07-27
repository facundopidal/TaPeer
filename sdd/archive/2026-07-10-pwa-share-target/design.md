# Technical Design: PWA and Share Target

## Technical Approach
This design details the implementation of installable PWA features, offline asset caching, share target ingestion, and secure clipboard link rendering in TaPeer. 

1. **PWA Setup**: Introduce `manifest.json` and service worker `sw.js`.
2. **GET Share Target**: Register GET share parameters mapping to `./`. On load, parse, run query string cleanup to prevent reload loops, extract the first URL if present, and POST it to `/text`.
3. **Safe Linkification**: Scan unescaped snippets for `http://` and `https://` URLs, escape everything, strip trailing punctuation from URLs, and wrap them in secure `<a>` tags.

---

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| **PWA Share Target Routing** <br>1. GET Share Target (client-side)<br>2. POST Share Target (server-side) | GET: Simpler routing, works under proxy paths, parses via `URLSearchParams`. POST: Can handle larger payloads but requires custom server-side routes and redirection. | **GET Share Target**. Minimizes backend changes and handles standard shared texts/URLs. |
| **URL Extraction Policy** <br>1. Match and post only URL<br>2. Concatenate title + text + URL | 1: Focuses clipboard history on the shared resource itself, matching typical mobile behaviors. 2: Pollutes snippet history with redundant helper text. | **Extract & POST URL only**. Fallback to entire text only if no URL matches. |
| **Safe Linkification Implementation** <br>1. Client-side tokenize-first regex<br>2. Third-party library | 1: Zero dependency, 100% XSS safe by escaping first and rendering static tag blocks. 2: Large footprint, potential XSS bypasses. | **Client-side tokenize-first regex**. Matches exactly `http://` / `https://` and strips trailing punctuation. |

---

## Data Flow

```
User Shares Text/URL (Android)
       │
       ▼
GET Request to PWA (./?title=...&text=...&url=...)
       │
       ├─► [app.js] Parse URL parameters
       │     │
       │     ├─► [app.js] Call window.history.replaceState() to clear URL query
       │     │
       │     └─► [app.js] Match first HTTP/HTTPS URL
       │           │
       │           ├─► (Found) ──► POST only URL to /text
       │           └─► (None)  ──► POST entire text to /text
       │
       ▼
[app.js] Fetch updated items from /items
       │
       ▼
[app.js] Render items in Clipboard History
       │
       └─► [app.js] safeLinkify(text) renders URLs as .jungle-link anchors
```

---

## File Changes

| File | Action | Description |
|---|---|---|
| [public/manifest.json](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/manifest.json) | Create | PWA manifest configuration with tapir mascot icon and GET share target. |
| [public/sw.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/sw.js) | Create | Service worker that caches skeleton assets (`index.html`, `app.js`, `style.css`, `manifest.json`, `icon.svg`) and responds from cache ignoring search params. Does not cache `/items`. |
| [public/icon.svg](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/icon.svg) | Create | Scalable tapir mascot SVG icon. |
| [public/index.html](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/index.html) | Modify | Link manifest.json and add meta `theme-color`. |
| [public/app.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/app.js) | Modify | Register Service Worker; execute immediate URL ingestion & replacement; implement `safeLinkify(text)` for history rendering. |
| [public/style.css](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/style.css) | Modify | Define `--jungle-link-color` theme variables and style `.jungle-link`. |

---

## Interfaces / Contracts

### PWA GET Share Target Manifest Configuration
```json
"share_target": {
  "action": ".",
  "method": "GET",
  "params": {
    "title": "title",
    "text": "text",
    "url": "url"
  }
}
```

### Ingestion & Linkification Logic in `app.js`
```javascript
function safeLinkify(text) {
  if (!text) return '';
  const urlRegex = /https?:\/\/[^\s"'<>`]+/g;
  let lastIndex = 0, result = '';
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    result += escapeHtml(text.substring(lastIndex, match.index));
    let rawUrl = match[0];
    const punctMatch = rawUrl.match(/[.,!?):;\]}]+$/);
    const trailingPunct = punctMatch ? punctMatch[0] : '';
    const cleanUrl = trailingPunct ? rawUrl.slice(0, -trailingPunct.length) : rawUrl;
    
    result += `<a class="jungle-link" href="${escapeHtml(cleanUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanUrl)}</a>${escapeHtml(trailingPunct)}`;
    lastIndex = urlRegex.lastIndex;
  }
  return result + escapeHtml(text.substring(lastIndex));
}
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit / Logic | Ingestion parsing & url extraction | Assert extraction of first URL from strings like `Watch: https://link.com` vs plain text fallback. |
| Unit / Logic | `safeLinkify` safety & punctuation | Assert output for XSS payloads (e.g. `<script>`) and correct stripping of trailing punctuation from anchors. |
| Integration | Service Worker Fetch Cache | Intercept request `index.html?title=foo` offline, verify it serves cached `index.html` (ignore search params). |

---

## Migration / Rollout
No database migration required. Dynamic subpath environments will be supported out of the box via relative path configurations in SW registration and web manifest.
