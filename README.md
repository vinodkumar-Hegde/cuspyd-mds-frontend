# Cuspyd MDS frontend

React and Vite build a static application served by Nginx on container port 8080. All data and privileged operations use the [backend API](https://github.com/vinodkumar-Hegde/cuspyd-mds-backend). This repository contains no database, email or AWS credentials.

| Path | Responsibility |
| --- | --- |
| `src/components/` | Student and administrator screens |
| `src/services/` | HTTP API clients and media URL resolution |
| `src/AuthContext.tsx` | Browser authentication state |
| `tests/` | API client tests |
| `Dockerfile` | Node 22 build, unprivileged Nginx runtime |
| `nginx.conf.template` | SPA routing, security headers and API proxy |
| `.github/workflows/ci.yml` | Independent repository checks |

## Configuration

| Variable | When read | Meaning |
| --- | --- | --- |
| `VITE_API_URL` | Build time | Blank for same-origin `/api` proxy; otherwise the HTTPS backend origin without `/api` or a trailing slash. Rebuild to change it. This is public configuration. |
| `API_UPSTREAM` | Container startup | Nginx upstream, default `http://api:8000`; private service DNS, not the browser URL. Applies to the same-origin proxy. |
| `API_PROXY_TARGET` | Vite development only | Default `http://127.0.0.1:8001`; not used by the Nginx image. |

For a single public origin, leave `VITE_API_URL` blank and route to the API through Nginx. For independent public hosting, build with the backend HTTPS origin and have the backend allow the frontend's exact origin through `CORS_ORIGIN`. Use HTTPS for API/media URLs; the current browser CSP permits HTTPS connections and images.

```sh
docker build --build-arg VITE_API_URL= -t cuspyd-mds-frontend:local .
```

To target an independently hosted API instead:

```sh
docker build --build-arg VITE_API_URL=https://api.example.com -t cuspyd-mds-frontend:local .
```

Replace the example hostname. The image reads `API_UPSTREAM` at runtime, but changing it does not replace a compiled `VITE_API_URL`.

## Checks and deployment

Run checks inside the Node image without installing Node on the host:

```sh
docker build --target build -t cuspyd-mds-frontend:checks .
docker run --rm cuspyd-mds-frontend:checks sh -c 'npm test && npm audit --omit=dev --audit-level=high'
```

CI runs the same checks and builds the image. Publish immutable image tags in your registry, then supply the frontend image reference to the [backend-owned deployment bundle](https://github.com/vinodkumar-Hegde/cuspyd-mds-backend/tree/main/deploy). CI does not publish or deploy automatically.

The runtime health endpoint is `/healthz`. `/api/health` is not an API health endpoint; API process/readiness checks are `/health` and `/ready` on port 8000, from the private network. Nginx serves `/assets/` with long-lived caching and falls back to `index.html` for application routes.

Before public release, verify the real client IP through the full ingress → Nginx → API chain. `X-Forwarded-For` is currently overwritten with Nginx's direct peer. If TLS terminates at another proxy, configure trusted real-IP handling there and in Nginx; the API also needs explicit trusted proxy configuration. See the [release checklist](https://github.com/vinodkumar-Hegde/cuspyd-mds-backend/blob/main/docs/RELEASE_CHECKLIST.md).

`mediaUrl()` accepts absolute HTTPS image URLs and prefixes API-hosted `/api/uploads/` paths with `VITE_API_URL`. The backend supports local storage or a private S3 bucket: the same stable API URLs serve local files or redirect to temporary signed S3 URLs. Configure S3 only in the backend environment. Database schema, email OTP and storage settings live in the [backend handoff](https://github.com/vinodkumar-Hegde/cuspyd-mds-backend/blob/main/docs/DEVOPS_HANDOFF.md).
