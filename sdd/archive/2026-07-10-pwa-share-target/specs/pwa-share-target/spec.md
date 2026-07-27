# Specification: PWA Share Target

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
