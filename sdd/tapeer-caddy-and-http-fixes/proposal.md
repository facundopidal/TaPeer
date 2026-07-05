# Proposal: TaPeer Caddy and HTTP Fixes

## Intent
Support hosting TaPeer on non-secure HTTP contexts (e.g. Tailscale/local network) and behind a reverse proxy subpath (`/tapeer/`), while hosting a dashboard landing page at the root (`/`) and keeping the mascot animation fully visible.

## Scope

### In Scope
- Update `public/app.js` fetches/links to be relative (no leading slash) to support `http://server/tapeer/`.
- Implement unified text copy utility with fallback to `document.execCommand('copy')` in `public/app.js` for HTTP.
- Remove automatic scrolling to `resultsContainer` in `handleSuccess`.
- Draft `Caddyfile` for `/tapeer` redirects, `/tapeer/*` reverse proxy with path stripping, and static root `/` hosting.
- Draft dashboard `index.html` landing page.

### Out of Scope
- Modifying backend server.js routing.
- Adding user authentication.

## Capabilities

### New Capabilities
- `multi-app-caddy-proxy`: Root dashboard, reverse proxying `/tapeer/` with trailing slash enforcement and path stripping.
- `http-clipboard-fallback`: Interactive copy utility working in both secure HTTPS and non-secure HTTP contexts.

### Modified Capabilities
- `file-text-sharing-subpath-compatible`: Sharing/downloading features function under reverse-proxied subpath locations.
- `upload-animation-visibility`: Keeps mascot animations fully visible by disabling automatic scrolling on success.

## Approach
1. **Relative Paths**: Change fetch endpoints (`upload`, `items`, `text`) and generated links (`download/`, `snippet/`) in `public/app.js` to omit leading slashes. In `handleSuccess`, parse the server-returned absolute URL paths to resolve relative to the current location context.
2. **HTTP Copy**: Wrap clipboard actions in `copyText(text)`. Fall back to creating a temporary, off-screen `<textarea>`, selecting its value, and executing `document.execCommand('copy')` when `navigator.clipboard` is unavailable.
3. **Mascot Animation**: Delete `resultsContainer.scrollIntoView` from the upload success handler.
4. **Caddy & Dashboard**: Use `redir /tapeer /tapeer/` to preserve relative path context. Use `handle_path /tapeer/*` to strip the prefix and reverse proxy to `localhost:3000`. Use `handle` to serve the static dashboard from `./dashboard` at `/`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `public/app.js` | Modified | Convert endpoints/links to relative; add clipboard fallback; remove scroll. |
| `sdd/tapeer-caddy-and-http-fixes/Caddyfile` | New | Caddy reverse proxy and landing redirect config. |
| `sdd/tapeer-caddy-and-http-fixes/dashboard/index.html` | New | Static dashboard landing page layout. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing trailing slash breaks relative fetches | Low | Caddyfile redirects `/tapeer` to `/tapeer/` automatically. |

## Rollback Plan
Revert changes in `public/app.js` via git checkout and delete/ignore Caddy files.

## Dependencies
- Caddy v2

## Success Criteria
- [ ] Application functions fully when hosted under subpath `http://server/tapeer/`.
- [ ] Copying links/snippets succeeds in non-secure HTTP contexts.
- [ ] Tapir tail-wagging animation is fully visible on successful share.
- [ ] Caddy serves dashboard at `/` and routes `/tapeer/` correctly.
