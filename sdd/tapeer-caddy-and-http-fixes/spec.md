</sdd-spec Skill>
<Specifications for TaPeer>
## Domain: file-text-sharing-subpath-compatible

### Requirements
| ID | Requirement | Strength |
| :--- | :--- | :--- |
| SF-1 | API requests (`upload`, `items`, `text`) in `public/app.js` MUST use relative paths without leading slash. | MUST |
| SF-2 | Absolute URLs returned by server (e.g. share links) MUST be resolved relatively to the page's current location context. | MUST |
| SF-3 | The application MUST function correctly when hosted under a subpath context (e.g. `/tapeer/`). | MUST |

### Scenarios
```gherkin
Scenario: Relative path fetch resolution
  Given application is loaded at "http://server/tapeer/"
  When the client sends a request to "upload"
  Then the request MUST resolve to "http://server/tapeer/upload"

Scenario: Absolute URL link resolution
  Given application is loaded at "http://server/tapeer/"
  When the server returns absolute URL "http://localhost:3000/download/123"
  Then the client MUST display/resolve it as "download/123" relative to current subpath
```

## Domain: http-clipboard-fallback

### Requirements
| ID | Requirement | Strength |
| :--- | :--- | :--- |
| CB-1 | Copy actions MUST use `navigator.clipboard.writeText` when available in secure contexts. | MUST |
| CB-2 | Copy actions MUST fallback to off-screen `<textarea>` using `document.execCommand('copy')` if API is unavailable. | MUST |
| CB-3 | Copying links or text snippets MUST succeed in non-secure HTTP contexts. | MUST |

### Scenarios
```gherkin
Scenario: Clipboard copy in secure context
  Given a secure HTTPS or localhost context with navigator.clipboard defined
  When user clicks a copy button
  Then client MUST copy text via navigator.clipboard.writeText

Scenario: Clipboard copy fallback in HTTP context
  Given a non-secure HTTP context where navigator.clipboard is undefined
  When user clicks a copy button
  Then client MUST fallback to document.execCommand('copy') and copy successfully
```

## Domain: upload-animation-visibility

### Requirements
| ID | Requirement | Strength |
| :--- | :--- | :--- |
| AV-1 | The upload success handler MUST NOT trigger any page scroll (`scrollIntoView` or `window.scrollTo`). | MUST |
| AV-2 | Mascot SVG wiggling/success animation MUST remain fully visible in the viewport after successful upload. | MUST |

### Scenarios
```gherkin
Scenario: Mascot animation remains visible
  Given user is at the top of the page
  When user successfully uploads a file
  Then page MUST NOT scroll automatically
  And mascot success animation MUST remain fully visible in the viewport
```

## Domain: multi-app-caddy-proxy

### Requirements
| ID | Requirement | Strength |
| :--- | :--- | :--- |
| PX-1 | Caddyfile MUST redirect requests from `/tapeer` to `/tapeer/` to preserve relative path context. | MUST |
| PX-2 | Caddyfile MUST proxy requests from `/tapeer/*` to `localhost:3000` with the `/tapeer` prefix stripped. | MUST |
| PX-3 | Caddyfile MUST serve the static dashboard from `./dashboard` at the root `/`. | MUST |

### Scenarios
```gherkin
Scenario: Enforce trailing slash
  Given Caddy is running
  When user requests "/tapeer"
  Then Caddy MUST redirect to "/tapeer/" with status 308

Scenario: Proxy with path stripping
  Given Caddy and backend on localhost:3000 are running
  When user requests "/tapeer/items"
  Then Caddy MUST strip "/tapeer" and proxy request to "localhost:3000/items"
```
