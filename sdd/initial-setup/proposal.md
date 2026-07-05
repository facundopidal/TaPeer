# Proposal: Initial Setup for TaPeer

## Intent
Establish a minimal, secure, and delightful file-and-text sharing tool (TaPeer) designed for trusted Tailscale networks.

## Scope
### In Scope
- Express server with Multer for file/text sharing.
- Read/download only access for shared files and snippets.
- Background cleanup task removing uploads/snippets older than 24 hours.
- Earth-toned UI featuring an interactive SVG tapir mascot (idle, drag-over, uploading, success) and tapir-themed loading text.

### Out of Scope
- User authentication/authorization (trusting Tailscale mesh network).
- Direct editing of shared content.
- Database integration (using disk storage with metadata files).

## Capabilities
### New Capabilities
- `file-sharing`: Multi-format file uploading and downloading.
- `text-sharing`: Text snippet pasting and retrieval.
- `automatic-expiration`: Cron/interval background cleanup at 24-hour mark.

## Approach
1. **Server Setup**: Express + Multer handles multipart/form-data. Text snippets are saved as `.txt` files in `uploads/`.
2. **Auto-Expiration**: A background timer runs hourly to delete all files in `uploads/` with modification times exceeding 24 hours.
3. **Frontend**: Single-page app styled in jungle/earth-tones. Embeds inline SVG tapir, manipulating its DOM/CSS class list via drag-and-drop and Fetch API events.

## Affected Areas
| Area | Impact | Description |
|---|---|---|
| `package.json` | Modified | Add express and multer dependencies, and start scripts. |
| `server.js` | New | Server entry point: configuration, routes, and cleanup task. |
| `public/` | New | Static asset directory containing index.html, style.css, and app.js. |
| `uploads/` | New | Server storage folder for files/texts. |

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Disk exhaustion | Low | Hourly background deletion of files older than 24 hours. |
| Path Traversal / Collision | Low | Sanitize filenames; prepend UUID/timestamp prefix. |
| XSS / Executable uploads | Low | Force download header (`Content-Disposition: attachment`). |

## Rollback Plan
Remove `server.js`, `public/`, and `uploads/` directories. Revert `package.json` to its initial empty state.

## Dependencies
- Node.js environment
- Express, Multer

## Success Criteria
- [ ] Users can upload files/paste texts and get download/read URLs.
- [ ] Background job deletes items exactly 24 hours after upload.
- [ ] SVG tapir mascot reacts accurately to idle, drag-over, upload, and success states.
