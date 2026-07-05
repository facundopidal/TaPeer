# Tasks: Initial Setup for TaPeer

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250-300 |
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
| 1 | Infrastructure & Server Setup | PR 1 | Initial package.json, server.js, uploads/ directory |
| 2 | Expiration Routine | PR 1 | setInterval cleanup of older files |
| 3 | Frontend (Jungle/Earth UI + Tapir Mascot) | PR 2 | Static assets, style, app.js, mascot animations |
| 4 | Verification & Testing | PR 2 | End-to-end testing scripts |

## Phase 1: Infrastructure & Server Setup

- [x] 1.1 Create `package.json` with `express` and `multer` dependencies and start scripts.
- [x] 1.2 Initialize `uploads/` directory on server startup if not present.
- [x] 1.3 Create `server.js` configuring basic Express middleware (JSON/URL-encoded parsers, CORS/security headers).
- [x] 1.4 Implement `POST /upload` endpoint using Multer disk storage; generate UUID file prefix, save file and metadata file (`<uuid>-meta.json`).
- [x] 1.5 Implement `POST /text` endpoint to save text snippets as `<uuid>-snippet.txt` and metadata `<uuid>-meta.json`.
- [x] 1.6 Implement `GET /download/:id` to stream files as attachments using `res.download` with `Content-Disposition: attachment`.
- [x] 1.7 Implement `GET /snippet/:id` to stream raw text snippet contents.

## Phase 2: Expiration Routine

- [x] 2.1 Implement hourly background execution loop in `server.js` using `setInterval`.
- [x] 2.2 Scan `uploads/` directory and check `mtimeMs` of all files using `fs.promises.stat()`.
- [x] 2.3 Unlink files and their corresponding metadata files (`-meta.json`) if modified time > 24 hours ago.
- [x] 2.4 Handle and log deletion errors without crashing the server process.

## Phase 3: Frontend Implementation (Earth/Jungle & Tapir Theme)

- [x] 3.1 Create `public/index.html` structure with drag-and-drop dropzone, text input area, and inline SVG Tapir mascot.
- [x] 3.2 Create `public/style.css` using jungle/earth palette (`#102A1E`, `#1D4D36`, `#F4F0EA`) with CSS variables and mascot animations (idle, drag-over, uploading, success).
- [x] 3.3 Create `public/app.js` to manage drag-and-drop event handlers, Fetch API requests, DOM class manipulation, and quote rotation during upload.

## Phase 4: Verification / Testing

- [x] 4.1 Create programmatic testing script `test.js` or `test-api.js` to verify file upload/download and text snippet share/get.
- [x] 4.2 Validate hourly cleanup by writing a test case that mocks `mtime` of files in `uploads/` and runs the cleanup routine.
- [x] 4.3 Manually verify frontend states (idle, drag-over, uploading, success) and responsive layout.
