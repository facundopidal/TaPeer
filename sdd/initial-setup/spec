</sdd-spec Skill>
<Specifications for TaPeer>
## Domain: file-sharing

### Requirements
| ID | Requirement | Strength |
| :--- | :--- | :--- |
| FS-1 | Accept multi-format uploads via `multipart/form-data` on `/upload`. | MUST |
| FS-2 | Generate unique download URL for each uploaded file. | MUST |
| FS-3 | Sanitize filenames and prefix with UUID/timestamp to prevent traversal/collision. | MUST |
| FS-4 | Serve files with `Content-Disposition: attachment` to prevent XSS. | MUST |
| FS-5 | Transition SVG mascot states: idle (wiggle ears), drag-over (stretch snout), uploading (chewing/walking), success (success badge). | MUST |

### Scenarios
- **Happy Path: File Upload & Download**
  Given a user has selected a file "photo.png"
  When they drop it onto the upload area
  Then the SVG mascot MUST animate uploading
  And the server MUST return a unique download URL
  And the mascot MUST display a success badge.

- **Edge Case: Malicious File Upload (XSS)**
  Given a user uploads "exploit.html"
  When they request the download URL for "exploit.html"
  Then the server MUST respond with `Content-Disposition: attachment` headers
  And the browser MUST download the file rather than execute it.

---

## Domain: text-sharing

### Requirements
| ID | Requirement | Strength |
| :--- | :--- | :--- |
| TS-1 | Accept text snippet submissions on `/share-text`. | MUST |
| TS-2 | Store text snippets as `.txt` files in `uploads/`. | MUST |
| TS-3 | Generate a unique read-only URL to retrieve the text snippet. | MUST |
| TS-4 | Reject empty text snippet submissions. | MUST |

### Scenarios
- **Happy Path: Snippet Share & Retrieval**
  Given a user has written a text snippet "API key"
  When they submit the snippet via the sharing form
  Then the server MUST save it as a unique `.txt` file
  And the server MUST return a retrieval URL
  And requesting that URL MUST return "API key".

- **Edge Case: Empty Snippet Submission**
  Given a user attempts to submit an empty text snippet
  When they post the snippet to `/share-text`
  Then the server MUST reject it with status `400 Bad Request`
  And no file MUST be created.

---

## Domain: automatic-expiration

### Requirements
| ID | Requirement | Strength |
| :--- | :--- | :--- |
| AE-1 | Run a background cleanup task hourly. | MUST |
| AE-2 | Delete all files in `uploads/` older than 24 hours (mtime). | MUST |
| AE-3 | Retain all files in `uploads/` younger than 24 hours. | MUST |
| AE-4 | Log cleanup errors without crashing the server. | MUST |

### Scenarios
- **Happy Path: Periodic Expiration**
  Given a file in `uploads/` was modified 25 hours ago
  When the background cleanup task runs
  Then the task MUST delete the file from disk.

- **Edge Case: Retaining Active Files**
  Given a file in `uploads/` was modified 2 hours ago
  When the background cleanup task runs
  Then the task MUST NOT delete the file.
