# Proposal: History and Theme Switch

## Intent
Improve UX by adding a 5-second auto-refreshing clipboard history list on the homepage and a persistent light/dark mode header toggle, while correcting responsive layout issues.

## Scope

### In Scope
- **Backend**: `GET /items` endpoint reading `uploads/` JSON metadata, filtering expired items, reading snippets, sorting desc by `uploadTime`, limiting to 10.
- **Frontend Clipboard/History**: Rendered on start and auto-refreshed every 5 seconds.
- **Text Snippets**: 150-char preview, expand/collapse toggles, and copy button.
- **Files**: Filename, size, and download link.
- **Theme Switch**: Light (warm sand) / Dark (deep jungle) mode toggle in header, persisting in `localStorage`.
- **Responsiveness**: Resolve horizontal overflow and scale down mascot SVG on mobile.

### Out of Scope
- File deletion from history list.
- Multi-page history (pagination/infinite scroll).
- Custom themes beyond light/dark.

## Capabilities

### New Capabilities
- `GET /items`: Fetch list of active shared items.
- `clipboard-history`: Display and refresh text/file history.
- `theme-persistence`: Persist light/dark theme preference.

### Modified Capabilities
- `mascot-and-layout`: Responsive rendering preventing viewport overflow.

## Approach
- **Server**: Implement route `GET /items`. Use `fs.readdir` to find `*-meta.json` files, parse, filter by `expiryTime > Date.now()`, read corresponding snippet text files if type is `text`, sort descending, limit to 10.
- **Client**: Fetch `/items` on load and every 5s via `setInterval`. Store expanded snippet IDs in a local `Set` to keep them expanded during auto-refreshes.
- **Theme**: Declare CSS variables on body. Add `.dark-mode` class rules for background (`#0c1a13`), cards (`#142d20`), text, and green highlights. Persist via `localStorage` and apply on page load.
- **Responsive**: Add `max-width: 100%` and `box-sizing: border-box` to container and cards to resolve overflow. Add mobile media query to scale down mascot SVG.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| [server.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/server.js) | Modified | Implement `GET /items` endpoint. |
| [public/index.html](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/index.html) | Modified | Add theme toggle markup and history list section. |
| [public/style.css](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/style.css) | Modified | Add CSS variables, dark theme classes, and layout overflow/SVG mobile fixes. |
| [public/app.js](file:///C:/Users/Win10/Desktop/Programacion/Dev/TaPeer/public/app.js) | Modified | History fetching/polling, copy helper, theme persistence, and expansion state retention. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| File I/O Race during cleanup | Low | Wrap snippet reads in `try-catch` to avoid crashes. |
| Redraw collapses expanded text | Medium | Keep expanded item IDs in local state and apply on render. |

## Rollback Plan
Discard working changes using `git checkout` for modified files.

## Dependencies
None.

## Success Criteria
- [ ] `GET /items` correctly filters expired uploads and returns up to 10 items.
- [ ] History list populates, auto-refreshes, and preserves expanded previews.
- [ ] Theme toggles to dark mode, persists on refresh, and uses spec colors.
- [ ] Mobile viewport has no horizontal scroll and mascot scales correctly.
