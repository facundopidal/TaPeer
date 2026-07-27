# Tasks: PWA and Share Target

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~140-180 |
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
| 1 | PWA Assets & SW Setup | PR 1 | Base setup for PWA installability and skeleton caching. |
| 2 | Share Ingestion & Linkification | PR 1 | Extract/post shared URLs and safely render clickable history links. |
| 3 | Testing & Verification | PR 1 | Verification of PWA, URL extraction, XSS safety, and style colors. |

## Phase 1: PWA Assets & Configuration

- [x] 1.1 Create [public/manifest.json](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/manifest.json) with PWA metadata, theme color, and a GET `share_target` mapping to `.`.
- [x] 1.2 Create [public/icon.svg](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/icon.svg) containing a scalable mascot SVG.
- [x] 1.3 Modify [public/index.html](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/index.html) to link the manifest and add the `theme-color` meta tag.
- [x] 1.4 Create [public/sw.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/sw.js) to cache skeleton assets on install, handle requests offline with `ignoreSearch: true`, and skip caching dynamic API routes.

## Phase 2: Share Ingestion & Linkification

- [x] 2.1 Modify [public/app.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/app.js) to register the service worker `sw.js` on window load.
- [x] 2.2 In [public/app.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/app.js), implement immediate GET query parsing, call `history.replaceState` to clear params, extract the first URL if present, and POST it (or the fallback text) to `/text`.
- [x] 2.3 Implement `safeLinkify(text)` in [public/app.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/app.js) to escape HTML, match HTTP/HTTPS URLs, strip trailing punctuation from links, and wrap them in secure `.jungle-link` anchors.
- [x] 2.4 Update the snippet rendering function in [public/app.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/app.js) to render snippet content via `safeLinkify`.
- [x] 2.5 Modify [public/style.css](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/style.css) to define `--jungle-link-color` (`#2e7d32` light / `#4caf50` dark) and style `.jungle-link`.

## Phase 3: Testing & Verification

- [x] 3.1 Verify PWA installability and manifest/icon registration in modern browser dev tools.
- [x] 3.2 Add test cases in [test.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/test.js) to assert query string URL extraction vs text fallback.
- [x] 3.3 Add test cases in [test.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/test.js) to assert `safeLinkify` escapes XSS tags and strips trailing punctuation.
- [x] 3.4 Verify offline loading using service worker cache when query parameters are present.
- [x] 3.5 Manually verify that links render correctly in light and dark modes with correct themed colors.
