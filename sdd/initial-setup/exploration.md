## Exploration: Initial Setup for TaPeer

### Current State
The project is a blank repository with only `.gitignore` and `.atl/skill-registry.md`. No server code, directory structures, dependencies, or frontend assets exist.

### Affected Areas
- `package.json` — For dependency configuration (Express, Multer, etc.) and npm scripts.
- `server.js` — The application's entry point and server initializer.
- `public/` — Static frontend assets including styles, script handlers, and interactive assets.
- `uploads/` — Storage directory for shared files.
- `sdd/initial-setup/exploration.md` — The persisted exploration artifact for this change.

---

### Approaches

#### Approach 1: Flat Structure with Basic Middleware (Zero Third-Party Upload Tools)
- **Description**: A single-file or flat Express app structure. File and text uploads are handled by building custom stream/buffer parsers on top of raw Node.js `http` request streams (or standard body parsers), avoiding the `multer` dependency.
- **Pros**:
  - Extremely minimal dependencies (Express only).
  - Keeps the initial footprint very small.
- **Cons**:
  - Parsing multipart/form-data manually in Node.js is complex, error-prone, and a common source of security vulnerabilities (e.g., buffer overflows, memory leaks, unhandled exceptions).
  - Difficult to safely enforce file size limits, file counts, and filename sanitization without writing substantial boilerplate.
  - Scales poorly as the sharing logic grows.
- **Effort**: Medium-High (due to writing and securing custom request body parsers).

#### Approach 2: Modular MVC-lite Structure with Express & Multer
- **Description**: A structured, modular organization that isolates routes, file-handling middleware, public assets, and server bootstrap logic. It utilizes `multer` for robust and secure handling of `multipart/form-data` uploads.
- **Pros**:
  - Uses `multer`, the industry-standard multipart processing middleware for Express, which handles disk storage, limits, and filename sanitization out-of-the-box.
  - Provides clean separation of concern: public frontend, private uploads folder, route definitions, and upload logic.
  - Easier to extend with features like file expiration times, custom URLs, and text-only clipboard sharing.
  - Highly secure by using UUIDs or timestamp prefixes to prevent path traversal and file collisions.
- **Cons**:
  - Introduces `multer` as an external dependency.
  - Incurs slightly more initial setup overhead compared to a single-file script.
- **Effort**: Low (Standard configuration, highly reliable).

---

### Comparison Matrix

| Option | Pros | Cons | Complexity | Effort |
| :--- | :--- | :--- | :--- | :--- |
| **Option 1 (Flat/Basic Middleware)** | Zero new dependencies | Insecure, complex multipart parsing, hard to scale | High | Medium-High |
| **Option 2 (Modular/Multer)** | Robust, secure, clean boundaries, easily extensible | Adds one standard dependency | Low | Low |

---

### Frontend Theme and Assets: Tapir Earth/Jungle Theme
To give the text and file sharing application its unique identity, we explore a custom layout featuring a jungle/earth-tone palette and interactive Tapir-themed components.

#### Color Palette (Earth & Jungle Tones)
- **Deep Jungle Green**: `#102A1E` (Main headers, dark theme background, or structural sections)
- **Foliage Green**: `#1D4D36` (Primary buttons, accents, highlights)
- **Earthy Mud/Clay**: `#6F583D` or `#8C7355` (Borders, card outlines, secondary text)
- **Warm Sand/Beige**: `#F4F0EA` (Main app background, readable and soft on eyes)
- **Tapir Charcoal**: `#2C2C2C` (Buttons, mascot silhouettes, dark text)
- **Alert Amber**: `#E69F00` (Jungle-like warning accent for errors/system alerts)

#### Interactive Tapir Mascot
- **SVG Mascot**: An inline SVG tapir displayed near the upload dropzone. 
- **Interactive States**:
  - *Idle*: Tapir contentedly stands in the corner, occasionally wiggling its ears (CSS animation).
  - *Drag-over*: As a file is dragged onto the screen, the tapir's snout stretches or opens, waiting to "eat" the upload.
  - *Processing/Uploading*: An animation of the tapir chewing or walking.
  - *Success*: The tapir wiggles its tail or displays a green leaf badge.
- **Micro-interactions**: Hovering over the tapir triggers a sound or a small speech bubble (e.g., "Tap here to paste text!").

---

### Recommendation
We strongly recommend **Approach 2 (Modular MVC-lite with Express & Multer)**. Building secure multipart file uploads without libraries in Node.js is risky and unnecessary. Multer allows us to quickly set up a file-sharing endpoint with robust safety limits, while the modular structure provides an clean directory to organize the HTML, CSS (using jungle/earth-tones), and interactive SVG tapir assets.

---

### Risks
- **Storage Exhaustion**: If shared files are stored indefinitely on disk with `fs`, the disk will eventually fill up. 
  - *Mitigation*: We should implement a basic auto-expiry middleware or cron-like function that deletes uploads older than 24 hours.
- **Arbitrary Code Execution**: Uploading raw scripts (e.g., `.html`, `.js`, or executable files) could lead to XSS or remote execution if served directly.
  - *Mitigation*: Sanitizing or stripping extension executability, or serving downloads with `Content-Disposition: attachment`.
- **Filename Collision**: Multiple users uploading `photo.png` could overwrite each other.
  - *Mitigation*: Using timestamped prefixes or UUIDs to save files, whilst preserving the original user-facing name in a database or metadata object.

---

### Ready for Proposal
**Yes** — The requirements and architectural directions are clear. The orchestrator should proceed to the proposal phase (`sdd-propose`) to draft the initial setup specifications.
