# Testing Capabilities - TaPeer

This document registers and describes the testing setup and capabilities for the **TaPeer** project.

## Metadata
- **Project**: TaPeer
- **Strict TDD**: `true`
- **Environment**: Node.js
- **Default Test Command**: `npm test` (executes `node test.js`)

## Testing Capabilities Matrix

| Layer | Runner / Framework | Target / Scope | Coverage | Config File |
| --- | --- | --- | --- | --- |
| **Integration** | Custom script (`test.js` with standard `assert`) | HTTP Endpoints & Background Expiration Routine | None | `package.json` |
| **Unit** | None | None | None | - |
| **Linting** | None | None | - | - |
| **Formatting** | None | None | - | - |
| **Type Checking** | None | None | - | - |

## Test Verification Setup
TaPeer uses a programmatic verification script located at `test.js`. It performs the following integration checks:
1. **POST /upload**: Verifies file uploads, returns IDs, download URLs, and metadata.
2. **GET /download/:id**: Retrieves uploaded files with correct security headers (CSP sandbox, X-Content-Type-Options: nosniff).
3. **POST /text**: Shares text snippets and returns retrieval URLs.
4. **GET /snippet/:id**: Retrieves shared text snippets with sandbox headers.
5. **Edge Cases**: Empty body checks for snippets (returns 400), invalid IDs (returns 404).
6. **Expiration Routine**: Verifies that files older than 24 hours are removed while newer files are kept.
7. **GET /items**: Returns active items, sorted descending by uploadTime, and filters out expired ones.
