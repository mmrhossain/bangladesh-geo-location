# bd-geo-service

A standalone reference-data service for the Bangladesh administrative hierarchy:

```
Division -> District -> Upazila/Thana -> Union
Post Office (separate postal dataset, optionally linked to an upazila)
```

The public API is read-only and cacheable. All writes go through an admin API protected by an API key. The full hierarchy is held in an in-memory snapshot for O(1) reads and is rebuilt after every successful admin write.

## Project layout

```
server/   Express API, dataset tooling, and tests
web/      Next.js console
```

## Quick start

Run these commands from the repository root.

```bash
# Install server and console dependencies
npm run setup

# Create local configuration
cp server/.env.example server/.env
# Edit server/.env and set MONGODB_URL and ADMIN_API_KEY

# Create indexes and load the bundled dataset
npm run db:indexes
npm run seed

# Start the service
npm start
```

Development mode with Node's built-in watcher:

```bash
npm run dev
```

`npm run dev` starts an in-memory MongoDB (unless `MONGODB_URL` is set), seeds the bundled dataset, starts the API on port `4000`, waits for `/ready`, and starts the Next.js console on port `3000` in development mode. The first run installs the UI dependencies. The development admin key defaults to `dev-admin-key-change-me-123456`; override it with `DEV_ADMIN_API_KEY`.

Set `WEB_MODE=production` to build the console and serve it with `next start` instead. Use this for shared previews: production chunk URLs change with each build, so a caching proxy cannot serve stale JavaScript against fresh HTML.

```bash
WEB_MODE=production npm run dev
```

Run tests (unit + integration with an in-memory MongoDB):

```bash
npm test
```

## Configuration

See `server/.env.example`. The service refuses to start if the environment is invalid. `ADMIN_API_KEY` is mandatory when `NODE_ENV=production` and must be at least 16 characters.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `4000` | HTTP port |
| `MONGODB_URL` | required | MongoDB connection string |
| `CORS_ORIGINS` | `*` | Comma-separated allowlist; use `*` only locally |
| `ADMIN_API_KEY` | required in production | `x-api-key` or `Authorization: Bearer` for admin routes |
| `MAX_JSON_SIZE` | `100kb` | JSON body limit |
| `ADMIN_IMPORT_MAX_SIZE` | `5mb` | JSON body limit for `/api/v1/admin/import` |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window |
| `RATE_LIMIT_MAX` | `300` | Requests per window per IP |
| `TRUST_PROXY` | `false` | Set to `true` behind a trusted proxy |
| `LOG_LEVEL` | `info` | pino log level |
| `DATASET_VERSION` | `1.0.0` | Fallback dataset version |
| `METRICS_ENABLED` | `true` | Expose `/metrics` |
| `METRICS_TOKEN` | unset | If set, `/metrics` requires `Authorization: Bearer <token>` |
| `REDIS_URL` | unset | Enables shared rate limiting and cross-instance cache invalidation |
| `REDIS_KEY_PREFIX` | `bd-geo` | Redis key namespace |
| `CACHE_INVALIDATION_CHANNEL` | `bd-geo:cache:invalidate` | Pub/sub channel for snapshot invalidation |
| `OTEL_ENABLED` | `false` | Enable OpenTelemetry tracing |
| `OTEL_SERVICE_NAME` | `bd-geo-service` | `service.name` resource attribute |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | OTLP/HTTP collector endpoint |

## Console UI

`web/` contains a Next.js 16 App Router console written in TypeScript with React 19 and Tailwind CSS 4. It is a separate app that talks to the API through same-origin rewrites, so the browser never needs CORS access to the API.

Pages:

- `/` overview: readiness, snapshot counts and dataset status.
- `/explore`: resource tabs, server-side search with debounce, cursor pagination and a record drawer.
- `/search`: cross-level search by English/Bangla name, alias or code.
- `/hierarchy`: expandable division-to-union tree with depth control.
- `/dataset`: dataset version, counts, API surface and request examples.
- `/admin`: key management, bulk JSON import and per-record edit/deprecate actions.

The admin key is stored in `sessionStorage` for the tab only and sent as `x-api-key`. Nothing is persisted server-side by the UI.

Pages that read public data are async server components that fetch the API through `web/src/lib/server-api.ts` during rendering and revalidate on a schedule (30 seconds for dataset metadata, 60 seconds for hierarchy and resource pages). Server-rendered data is passed into the client hooks as initial state, so first paint is complete and no duplicate request is made after hydration. Interactive changes such as tab switches, search, pagination and drawer actions still fetch from the browser. If the API is unavailable at render time, the page falls back to an empty state and the client retries on mount.

```bash
# Run the console against an API on port 4000
API_PROXY_URL=http://127.0.0.1:4000 npm run dev:web

# Production build and start
npm run build:web
API_PROXY_URL=http://127.0.0.1:4000 npm run start:web

# Lint
npm run lint:web
```

`API_PROXY_URL` defaults to `http://127.0.0.1:4000`. `web/.env.example` documents the variable. It is read when Next builds the rewrite configuration, so set it in the build environment as well as at runtime. The dev server accepts `*.monkeycode-ai.live` hosts for preview environments.

The Next.js rewrite forwards client addresses in `X-Forwarded-For`. Set `TRUST_PROXY=true` on the API when the console proxies to it (the development orchestrator already does) so rate limiting uses the real client IP.

## Public API

Base path: `/api/v1`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/divisions` | All divisions |
| GET | `/divisions/:code` | One division |
| GET | `/divisions/:code/districts` | Districts of a division |
| GET | `/districts` | All districts |
| GET | `/districts/:code` | One district |
| GET | `/districts/:code/upazilas` | Upazilas of a district |
| GET | `/upazilas` | All upazilas |
| GET | `/upazilas/:code` | One upazila |
| GET | `/upazilas/:code/unions` | Unions of an upazila |
| GET | `/unions` | All unions |
| GET | `/unions/:code` | One union |
| GET | `/post-offices` | All post offices; filter with `districtCode` or `upazilaCode` |
| GET | `/post-offices/:code` | One post office |
| GET | `/hierarchy?depth=1..4` | Nested administrative tree |
| GET | `/search?q=...&type=...&page=1&limit=20` | Search by name, Bangla name, alias, or code |
| GET | `/meta/dataset` | Dataset version, import time, counts, and load status |
| GET | `/openapi.json` | OpenAPI 3.0 document for the public and admin APIs |

List endpoints accept optional `limit` (1-200) and `cursor` parameters. When `limit` is present, the response includes a `meta` object with `nextCursor`; pass it back as `cursor` to fetch the next page. Orders are deterministic by name and code.

```bash
curl "http://localhost:4000/api/v1/unions?limit=50"
curl "http://localhost:4000/api/v1/unions?limit=50&cursor=<nextCursor>"
```

List endpoints accept `includeDeprecated=true` to include retired records. Deprecated records remain resolvable by code for referential stability but are hidden from lists, search, and hierarchy by default.

Responses use a stable envelope:

```json
{
  "status": "success",
  "data": []
}
```

Errors:

```json
{
  "status": "fail",
  "code": "GEO_DIVISION_NOT_FOUND",
  "message": "Division \"ZZZ\" was not found",
  "requestId": "..."
}
```

Public responses are sent with `Cache-Control: public, max-age=300, stale-while-revalidate=86400` and an ETag. Errors are sent with `Cache-Control: no-store`.

## Admin API

Base path: `/api/v1/admin`. Authenticate with `x-api-key: <ADMIN_API_KEY>`.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/import` | Idempotent hierarchical bulk upsert keyed by `code` |
| PATCH | `/:resource/:code` | Update `name`, `bn_name`, `aliases`, or division `iso_code` |
| POST | `/:resource/:code/deprecate` | Set `{"deprecated": true}` or restore with `false` |

`resource` is one of `divisions`, `districts`, `upazilas`, `unions`, `post-offices`.

## Dataset format

The importer is idempotent and validates the entire payload before writing. Parent references must resolve to an existing record or another record in the same payload. Duplicate codes are rejected before any write; duplicate names are allowed when codes differ.

```json
{
  "datasetVersion": "1.0.0",
  "note": "BBS administrative geography, retrieved 2026-01-15.",
  "divisions": [
    { "code": "BD-13", "name": "Dhaka", "bn_name": "ঢাকা", "iso_code": "BD-13", "aliases": ["Dacca"] }
  ],
  "districts": [
    { "code": "D-13", "name": "Dhaka", "bn_name": "ঢাকা", "divisionCode": "BD-13", "aliases": [] }
  ],
  "upazilas": [
    { "code": "U-0001", "name": "Savar", "bn_name": "সাভার", "districtCode": "D-13", "aliases": [] }
  ],
  "unions": [
    { "code": "UN-0001", "name": "Savar Union", "bn_name": "সাভার ইউনিয়ন", "upazilaCode": "U-0001", "aliases": [] }
  ],
  "postOffices": [
    { "code": "PO-0001", "name": "Savar", "bn_name": "সাভার", "districtCode": "D-13", "upazilaCode": "U-0001", "aliases": [] }
  ]
}
```

Import a custom file:

```bash
npm run seed -- ./path/to/dataset.json
```

The default dataset is `server/src/modules/geography/data/bd-geo.json`: 8 divisions, 64 districts, 494 upazilas, and 4,540 unions. Official renames are normalized for Chattogram, Barishal, Cumilla, Cox's Bazar, and Jhalokathi; alternate spellings are kept as aliases. Postal codes are not included, so `postOffices` is empty by default. Add a separate postal dataset before relying on post-office endpoints.

Rebuild the dataset from a remote JSON export by setting `BD_GEO_SOURCE_BASE` to the export root, where `divisions/divisions.json`, `districts/districts.json`, `upazilas/upazilas.json`, and `unions/unions.json` resolve:

```bash
BD_GEO_SOURCE_BASE=https://example.com/path npm run dataset:build
```

To build from local source files instead, point `BD_GEO_SOURCE_DIR` at the directory containing those files:

```bash
BD_GEO_SOURCE_DIR=./upstream-json npm run dataset:build -- ./src/modules/geography/data/bd-geo.json
```

The smaller `server/src/modules/geography/data/bd-geo.sample.json` remains as a deterministic fixture for tests. Dataset command paths are resolved from `server/`, so prefix a path with `../` to reference files outside that folder. Codes are the identity of a record, so duplicate names under the same parent are allowed where the source data contains them.

Verify the community dataset against an authoritative BBS/a2i release and review licensing before production use.

## Scaling with Redis

Redis is optional. Without `REDIS_URL`, rate limits are per-process and admin writes invalidate only the local snapshot, which is correct for a single instance.

When `REDIS_URL` is set:

- Rate limiting uses a shared Redis store, so limits apply across all instances.
- Every admin write publishes to `CACHE_INVALIDATION_CHANNEL`. Every instance reloads its snapshot, so stale reads are bounded by the write, not by a TTL.
- If Redis is unreachable at startup, the service logs the error and falls back to the in-memory store instead of failing.

For local production-like setup:

```bash
docker compose up -d mongo redis
docker compose run --rm app npm run db:indexes
docker compose run --rm app npm run seed
docker compose up -d app
```

## Validating a dataset

Validate a dataset file before importing it:

```bash
npm run dataset:validate -- ./path/to/dataset.json
```

The command checks codes, parent references, duplicate codes, and unknown fields, then prints per-entity counts without touching the database.

## Observability

- `GET /health` is a liveness probe.
- `GET /ready` is a readiness probe; it returns 503 until the snapshot is loaded and non-empty.
- `GET /metrics` exposes Prometheus metrics: default process metrics prefixed with `bd_geo_`, request count and latency by method/route/status, cache readiness, entity counts, dataset import duration and outcomes, and admin write counts.
- Admin writes are logged as structured audit events with the request ID, resource, code, and action.
- All requests carry `x-request-id`; pass your own header to propagate a trace ID.
- `GET /api/v1/meta/dataset` returns the dataset version, import time, record counts, and note.

### Tracing

Set `OTEL_ENABLED=true` and point `OTEL_EXPORTER_OTLP_ENDPOINT` at an OTLP/HTTP collector. The service instruments inbound HTTP, Express, MongoDB, and Redis, and ignores `/health`, `/ready`, and `/metrics` to keep traces focused. `npm start` and `npm run dev` load the tracing preload before the application so instrumentation is installed early. If the SDK or collector is unavailable, the service logs the error and continues without tracing.

## Production notes

- Run `npm run db:indexes` as a migration step before the first deploy and after schema changes. The service runs with `autoIndex: false` in production.
- The service loads the full dataset into memory at boot. Readiness returns 503 until the snapshot is loaded and non-empty.
- Deploy the container (`server/Dockerfile`) behind a CDN or reverse proxy. Set `TRUST_PROXY=true` only when the proxy is trusted.
- The console is a separate Next.js process. Build it with `npm run build:web`, start it with `npm run start:web`, and set `API_PROXY_URL` to the API's internal address. Expose only the Next.js port to users; its rewrites proxy `/api`, `/health`, and `/ready`.
- `server/vercel.json` and `server/api/index.js` provide a serverless entry point, but the container is the recommended deployment for this workload.
- Rate limiting uses Redis when configured. Without Redis it falls back to a per-process in-memory store.
- Admin writes are sequential bulk upserts. For atomic multi-collection imports on MongoDB, run a replica set and add a transaction around the import.
- The OpenAPI document is served at `/api/v1/openapi.json`. Keep it in sync with route and schema changes.
- Remaining P2 work: an optional read-through Redis response cache for extreme read volume. The in-memory snapshot already answers reads in O(1), so measure before adding it.

## Architecture

The API is a modular monolith. Each module owns its routes, controller, service, validation, and persistence details, and exposes a small `index.js` public API. Shared infrastructure lives outside the modules.

```
server/index.js                         bootstrap, graceful shutdown, server timeouts
server/app.js                           Express wiring, CORS, logging, body limits
server/api/index.js                     serverless adapter
server/src/api.routes.js                composition root for /api/v1

server/src/modules/geography/           public read model and dataset
  index.js                              module public API
  geography.routes.js                   divisions, districts, upazilas, unions, post offices, hierarchy, search
  geography.controller.js
  geography.service.js
  geography.schemas.js
  geography.cache.js                    in-memory snapshot and search index
  geography.repository.js               Mongoose queries and writes
  geography.indexes.js                  index migration
  models/                               Division, District, Upazila, Union, PostOffice, DatasetMeta
  data/                                 bundled full and sample datasets

server/src/modules/administration/      write model
  index.js                              module public API
  administration.routes.js              import, update, deprecate
  administration.controller.js
  administration.service.js
  administration.schemas.js

server/src/modules/platform/            operational surface
  index.js                              module public API
  platform.routes.js                    /, /health, /ready, /metrics, /api/v1/openapi.json
  platform.controller.js
  openapi.js                            OpenAPI 3.0 contract

server/src/shared/config/               validated environment and MongoDB connection
server/src/shared/http/                 responses, async handler, validation, pagination, errors, cache headers
server/src/shared/observability/        logger, metrics, tracing
server/src/shared/persistence/          Redis and cache invalidation
server/src/shared/security/             admin authentication and rate limiting
server/src/shared/errors/               AppError
server/src/shared/utils/                text normalization and search tokens
server/src/scripts/                     seed, dataset build/validation, index migration
server/scripts/dev.mjs                  development orchestrator (Mongo, seed, API, UI)
server/tests/                           unit and integration tests
web/                                    Next.js 16 console (App Router, TypeScript, React 19, Tailwind 4)
```
