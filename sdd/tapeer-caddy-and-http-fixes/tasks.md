# Tasks: TaPeer Caddy and HTTP Fixes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~40-70 |
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
| 1 | Relative Endpoint Refactoring | PR 1 | Convert fetches, links, and anchors in public/app.js to relative paths. |
| 2 | Clipboard Fallback Utility | PR 1 | Implement unified copy helper with document.execCommand fallback for non-secure HTTP. |
| 3 | Mascot Scroll Prevention | PR 1 | Disable automatic viewport scrolling on upload success to keep mascot visible. |
| 4 | Caddy & Dashboard Deployment | PR 1 | Draft Caddyfile reverse proxy rules and the landing page dashboard. |
| 5 | Verification & Testing | PR 1 | Verify routing under HTTP proxy and manually test copying/animations. |

## Phase 1: Frontend Path & Scroll Refactoring

- [x] 1.1 In `public/app.js`, remove leading slashes from all API endpoints: `fetch('upload')`, `fetch('text')`, and `fetch('items')` to support hosting in a subpath context.
- [x] 1.2 In `public/app.js` `renderHistory(items)`, update the file download anchor to use a relative path (`download/${item.id}`) instead of an absolute path (`/download/${item.id}`).
- [x] 1.3 In `public/app.js` `handleSuccess(url, isSnippet)`, convert the server-returned absolute path to relative by stripping the leading slash and constructing the share URL via `new URL(cleanUrl, window.location.href).href`.
- [x] 1.4 In `public/app.js` `handleSuccess`, remove the `resultsContainer.scrollIntoView({ behavior: 'smooth' })` line so the page remains at the top and the mascot animation remains fully visible.

## Phase 2: HTTP Clipboard Fallback

- [x] 2.1 In `public/app.js`, implement a unified `copyToClipboard(text, button)` helper that attempts `navigator.clipboard.writeText` and falls back to a temporary off-screen `<textarea>` using `document.execCommand('copy')` if the navigator API is unavailable.
- [x] 2.2 Refactor the click listener on `copyBtn` in `public/app.js` to call `copyToClipboard(shareLink.value, copyBtn)`.
- [x] 2.3 Update the history copy handler in `public/app.js` to reuse the unified `copyToClipboard(content, e.target)` helper for copying snippet text.
- [x] 2.4 Ensure the clipboard utility correctly handles asynchronous resolution and applies the 2-second "Copied!" button color/text change feedback.

## Phase 3: Reverse Proxy & Dashboard Setup

- [x] 3.1 Create `sdd/tapeer-caddy-and-http-fixes/Caddyfile` with a redirect from `/tapeer` to `/tapeer/`, reverse-proxying `/tapeer/*` to `localhost:3000` with path stripping (`handle_path`), and serving static files from `./dashboard` at `/`.
- [x] 3.2 Create `sdd/tapeer-caddy-and-http-fixes/dashboard/index.html` with a basic landing page layout directing the user to `/tapeer/`.

## Phase 4: Verification / Testing

- [x] 4.1 Launch backend server and verify relative path resolution works for file uploads, snippet posts, and history loading.
- [x] 4.2 Run app on a non-secure HTTP context and verify copying share links and history snippets completes successfully via the fallback method.
- [x] 4.3 Verify wiggling ears/tail mascot animations remain fully visible on successful upload without scrolling.
- [x] 4.4 Run Caddy with the drafted configuration, verifying that accessing `http://localhost/` loads the dashboard, `/tapeer` redirects correctly, and `/tapeer/` serves the main app.
