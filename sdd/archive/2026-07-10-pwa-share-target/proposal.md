# Proposal: PWA and Share Target

## Intent
Enable PWA installation, support system-level URL/text sharing to TaPeer, and securely display clickable links in Clipboard History.

## Scope
### In Scope
- **PWA assets**: PWA manifest, service worker caching, and Mascot SVG icon.
- **GET Share Target**: Extract `title`/`text`/`url` query parameters, async POST to `text`, and clear query string.
- **Safe Linkification**: XSS-safe parser detecting `http://` or `https://` URLs in clipboard text and rendering them as styled `.jungle-link` anchors.
- **Theme Styling**: Hyperlinks matching light/dark jungle themes.

### Out of Scope
- POST-based share target server routing.
- Third-party linkification libraries.

## Capabilities
### New Capabilities
- `pwa-share-target`: PWA registration and GET share integration.
- `safe-linkification`: XSS-safe tokenization and rendering of URLs.
- `share-ingestion`: Client-side parsing/ingestion of shared query parameters.

### Modified Capabilities
- `clipboard-history`: Clickable, theme-styled jungle hyperlinks.

## Approach
- **PWA Setup**: Create `manifest.json` (GET target mapped to `./`), `sw.js` (asset cache with `ignoreSearch: true`), and `icon.svg` icon.
- **Ingestion**: On load, check query string. Immediately call `history.replaceState` to prevent reload duplicates, then asynchronously POST payload.
- **Linkification**: Escape text in `app.js`, tokenize using regex, replace `http://`/`https://` with styled secure `<a>` tags, stripping trailing punctuation.
- **Styling**: Style `.jungle-link` with appropriate greens (`#2e7d32` / `#4caf50`) on `style.css`.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `public/index.html` | Modified | Add manifest link and theme-color meta tag. |
| `public/app.js` | Modified | SW registration, share ingestion/deduplication, and safe linkification. |
| `public/style.css` | Modified | Add `.jungle-link` theme-based styles. |
| `public/manifest.json` | New | PWA metadata and share target layout. |
| `public/sw.js` | New | Offline asset caching service worker. |
| `public/icon.svg` | New | SVGs icon representation of mascot. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Duplicate Shares | High | Run `replaceState` instantly before POSTing. |
| XSS Injection | Medium | Escape HTML before matching URLs. |
| Subpath mismatches | Low | Use relative paths and `.`/`./` targets in manifest. |

## Rollback Plan
Delete `public/manifest.json`, `public/sw.js`, and `public/icon.svg`. Revert modified files to the previous commit.

## Dependencies
- Modern browser supporting SW, Cache, and Share Target.

## Success Criteria
- [ ] PWA is installable on mobile and desktop.
- [ ] Shared items populate history and query string is cleared instantly.
- [ ] URLs in history render as clickable, secure links.
- [ ] Malicious shared strings do not trigger XSS.

## Proposal question round
1. **Payload Concatenation**: If sharing both URL and text, should we concatenate them (e.g. `[text] [url]`) into the snippet?
2. **Offline Scope**: Is caching only the skeleton (`index.html`, `app.js`, `style.css`) sufficient, or should we store history elements offline?
3. **Protocol Restricting**: Should safe linkification strictly allow `http://` and `https://` schemes?
