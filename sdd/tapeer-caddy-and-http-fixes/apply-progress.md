# Apply Progress: TaPeer Caddy and HTTP Fixes

**What**: Implemented relative path fetches/links, clipboard copy fallback with document.execCommand, and scroll prevention on successful share in public/app.js. Verified Caddyfile and dashboard/index.html.
**Why**: Support hosting under subpath reverse proxy and HTTP contexts while keeping mascot wiggling/success animation visible.
**Where**: public/app.js, sdd/tapeer-caddy-and-http-fixes/Caddyfile, sdd/tapeer-caddy-and-http-fixes/dashboard/index.html
**Learned**: document.execCommand fallback works seamlessly in non-secure contexts.
