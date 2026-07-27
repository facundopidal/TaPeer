# Specification: PWA Share Target Spec

## Domain: pwa-share-target

### Requirements
| ID | Description | Strength |
|---|---|---|
| PWA-REQ-101 | System MUST provide `manifest.json` defining GET Web Share Target with `title`/`text`/`url` parameters. | MUST |
| PWA-REQ-102 | SW MUST cache skeleton assets (`index.html`, `app.js`, `style.css`, `manifest.json`) on install. | MUST |
| PWA-REQ-103 | SW MUST NOT cache history endpoint `/items` or other dynamic API resources. | MUST |
| PWA-REQ-104 | SW cache matching MUST ignore search queries (`ignoreSearch: true`). | MUST |

### Scenarios
#### Scenario: SW Caches Skeleton Only
- GIVEN a user installs the PWA
- WHEN SW installation fires
- THEN core assets are cached and `/items` is not cached

#### Scenario: SW Services URL with Search Params
- GIVEN SW is active and core assets cached
- WHEN browser requests `index.html?title=foo` offline
- THEN SW MUST return cached `index.html` via `ignoreSearch: true`

---

## Domain: share-ingestion

### Requirements
| ID | Description | Strength |
|---|---|---|
| ING-REQ-101 | Client MUST detect `title`, `text`, or `url` query parameters on load. | MUST |
| ING-REQ-102 | Client MUST immediately call `history.replaceState` to clear query parameters and prevent duplicate shares. | MUST |
| ING-REQ-103 | Client MUST extract any HTTP/HTTPS URL from the shared text string (e.g. YouTube share format). | MUST |
| ING-REQ-104 | Client MUST POST only the extracted URL if found. If no URL is found, it MUST fallback to the full text string. | MUST |

### Scenarios
#### Scenario: Ingestion Extracts URL
- GIVEN load with URL parameter `text=Watch: https://youtu.be/abc`
- WHEN share-ingestion runs
- THEN query params are cleared via `replaceState`
- AND client POSTs `https://youtu.be/abc` to text endpoint

#### Scenario: Ingestion Text Fallback
- GIVEN load with URL parameter `text=Hello World`
- WHEN share-ingestion runs
- THEN query params are cleared
- AND client POSTs `Hello World` to text endpoint

---

## Domain: safe-linkification

### Requirements
| ID | Description | Strength |
|---|---|---|
| LNK-REQ-101 | Linkification MUST only allow `http://` and `https://` schemes. | MUST |
| LNK-REQ-102 | Parser MUST escape HTML entities to prevent XSS before tokenizing and rendering URLs. | MUST |
| LNK-REQ-103 | Matched URLs MUST render as anchor tags with `.jungle-link`, `target="_blank"`, and `rel="noopener noreferrer"`. | MUST |
| LNK-REQ-104 | Trailing punctuation (like `.`, `,`, `!`, `?`, `)`) MUST be stripped from matched URLs before generating links. | MUST |

### Scenarios
#### Scenario: Safe Linkification Output
- GIVEN text `Go to http://test.com/a. and click!`
- WHEN safe-linkification runs
- THEN output is `Go to <a class="jungle-link" href="http://test.com/a" target="_blank" rel="noopener noreferrer">http://test.com/a</a>. and click!`

#### Scenario: XSS Mitigation
- GIVEN text `<script>alert(1)</script> https://safe.com`
- WHEN safe-linkification runs
- THEN HTML tags are escaped and only `https://safe.com` is a link

---

## Domain: clipboard-history

### ADDED Requirements
| ID | Description | Strength |
|---|---|---|
| HS-REQ-205 | Snippet cards MUST render detected URLs as secure clickable hyperlinks using `safe-linkification`. | MUST |
| HS-REQ-206 | Hyperlink class `.jungle-link` MUST use themed green: `#2e7d32` (light) and `#4caf50` (dark). | MUST |

### Scenarios
#### Scenario: Render Clickable Links in Snippet
- GIVEN snippet `Visit https://tapeer.local` in history
- WHEN clipboard-history renders
- THEN `https://tapeer.local` is rendered as `.jungle-link` with active theme green

#### Scenario: Theme Change Updates Link Color
- GIVEN light mode with a `.jungle-link` card (color `#2e7d32`)
- WHEN user toggles dark mode
- THEN link color changes to `#4caf50`
