# Release Popups — API Reference

Backend-driven release announcement popup system. Admins (external admin webapp) create rows via CRUD endpoints; the main webapp fetches the single highest-priority active popup matching each user's plan on dashboard load.

---

## 1. Connectivity

### Base URL

```
<BACKEND_BASE_URL>
```

| Environment | Example |
|---|---|
| Local dev | `http://localhost:8000/api` |
| Staging | `https://staging-api.he2.ai/api` |
| Production | `https://api.he2.ai/api` |

All paths in this document are appended to the base URL.

### Authentication

The admin endpoints support **two** authentication methods. The public endpoint requires a logged-in user.

#### Admin endpoints

Send **either** header on every request:

```http
X-Admin-Api-Key: <ADMIN_API_KEY>
```

or

```http
Authorization: Bearer <COGNITO_JWT>
```

- `X-Admin-Api-Key` is the static secret in `KORTIX_ADMIN_API_KEY` env var. Use this from the external admin webapp.
- Cognito JWT works when the user's `sub` is in the `ADMIN_USER_IDS` env list. Use this if the admin webapp shares the main app's Cognito session.

A `401` indicates no valid credential. A `403` indicates a valid credential but the user is not an admin.

#### Public endpoint

```http
Cookie: <cognito-session-cookies>
```

Or:

```http
Authorization: Bearer <COGNITO_JWT>
```

The webapp's existing fetch wrapper (`getAuthHeaders()` + `credentials: 'include'`) already handles this.

### Common headers

```http
Content-Type: application/json
Accept: application/json
```

---

## 2. Endpoint Reference

### 2.1 Public — webapp consumer

#### `GET /v2/release-popups/active`

Returns the single highest-priority active popup matching the caller's plan, or **204 No Content** when nothing matches.

**Request**

```http
GET /v2/release-popups/active HTTP/1.1
Authorization: Bearer <jwt>
```

**Response — 200 OK**

```json
{
  "id": "f3b5c7e2-1234-4abc-9def-aabbccddeeff",
  "title": "Billing System Upgrade",
  "body": "We have launched a brand new billing system...",
  "image_url": "https://cdn.example.com/billing-upgrade.png",
  "cta_label": "View Details",
  "cta_url": "https://app.he2.ai/billing/details",
  "priority": 10,
  "end_at": "2026-06-01T00:00:00Z"
}
```

**Response — 204 No Content**

Empty body. Treat as "no popup to show".

---

### 2.2 Admin — list

#### `GET /v2/admin/release-popups`

Returns a paginated list of popups with filters. Sorted by `priority DESC, created_at DESC`.

**Query params**

| Param | Type | Default | Notes |
|---|---|---|---|
| `is_active` | bool | — | Filter by `is_active` flag |
| `active_now` | bool | — | True → only popups currently inside their `[start_at, end_at)` window AND `is_active=true` |
| `audience` | enum | — | One of `all`, `free`, `paid`, `specific` |
| `limit` | int | 50 | 1..200 |
| `offset` | int | 0 | ≥0 |

**Request**

```http
GET /v2/admin/release-popups?active_now=true&limit=20 HTTP/1.1
X-Admin-Api-Key: <secret>
```

**Response — 200 OK**

```json
{
  "items": [ ReleasePopup, ReleasePopup, ... ],
  "total": 42
}
```

---

### 2.3 Admin — create

#### `POST /v2/admin/release-popups`

**Request body** — see [ReleasePopupCreate](#release-popup-create) schema below.

**Request**

```http
POST /v2/admin/release-popups HTTP/1.1
X-Admin-Api-Key: <secret>
Content-Type: application/json

{
  "title": "Billing System Upgrade",
  "body": "We have launched a brand new billing system...",
  "image_url": "https://cdn.example.com/billing-upgrade.png",
  "cta_label": "View Details",
  "cta_url": "https://app.he2.ai/billing/details",
  "audience": "all",
  "plan_tiers": [],
  "start_at": "2026-05-25T00:00:00Z",
  "end_at": "2026-06-01T00:00:00Z",
  "is_active": true,
  "priority": 10
}
```

**Response — 201 Created**

Full `ReleasePopup` object (admin view).

---

### 2.4 Admin — read one

#### `GET /v2/admin/release-popups/{id}`

**Request**

```http
GET /v2/admin/release-popups/f3b5c7e2-1234-4abc-9def-aabbccddeeff HTTP/1.1
X-Admin-Api-Key: <secret>
```

**Response — 200 OK** → full `ReleasePopup`.
**Response — 404 Not Found** → `{ "detail": "Release popup not found" }`.

---

### 2.5 Admin — update

#### `PATCH /v2/admin/release-popups/{id}`

Partial update. Send only the fields being changed. Cross-field validation runs against the merged state.

**Request**

```http
PATCH /v2/admin/release-popups/f3b5c7e2-... HTTP/1.1
X-Admin-Api-Key: <secret>
Content-Type: application/json

{
  "priority": 20,
  "end_at": "2026-06-08T00:00:00Z"
}
```

**Response — 200 OK** → updated `ReleasePopup`.

---

### 2.6 Admin — disable (soft delete)

#### `DELETE /v2/admin/release-popups/{id}`

Soft delete. Sets `is_active = false`; the row is preserved for audit + re-enable. To re-enable, `PATCH` with `is_active: true`.

**Request**

```http
DELETE /v2/admin/release-popups/f3b5c7e2-... HTTP/1.1
X-Admin-Api-Key: <secret>
```

**Response — 200 OK** → the (now disabled) `ReleasePopup`.

---

## 3. Schemas

### 3.1 ReleasePopupCreate

Used in `POST` request body.

| Field | Type | Required | Constraints | Notes |
|---|---|---|---|---|
| `title` | string | yes | 1..200 chars | Header shown in modal |
| `body` | string | yes | 1..5000 chars | Markdown — rendered with GFM |
| `image_url` | string \| null | no | URL, ≤2048 chars | Right-pane image; admin hosts elsewhere |
| `cta_label` | string \| null | no | ≤50 chars | Paired with `cta_url` |
| `cta_url` | string \| null | no | URL, ≤2048 chars | Paired with `cta_label` |
| `audience` | enum | no, default `all` | `all` \| `free` \| `paid` \| `specific` | Targeting bucket |
| `plan_tiers` | string[] | no, default `[]` | non-empty when `audience=specific` | Plan slugs: `starter`, `pro`, `pro_creative`, `max` |
| `start_at` | ISO-8601 | yes | — | Window start |
| `end_at` | ISO-8601 | yes | `> start_at` | Window end; UI default = `start_at + 7d` |
| `is_active` | bool | no, default `true` | — | Disable to hide |
| `priority` | int | no, default `0` | — | Higher wins on tie |

**Validation rules**

1. `cta_label` and `cta_url` — both set, or both null. One-set-one-null → `400`.
2. `audience == "specific"` → `plan_tiers` must be non-empty.
3. `end_at` must be strictly greater than `start_at`.
4. When `audience != "specific"`, server clears `plan_tiers` to `[]` on save.

### 3.2 ReleasePopupUpdate

Used in `PATCH` request body. **Every field is optional.** Send only what's changing. Cross-field rules apply to the merged state.

### 3.3 ReleasePopup (admin response)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `title` | string | |
| `body` | string | Markdown |
| `image_url` | string \| null | |
| `cta_label` | string \| null | |
| `cta_url` | string \| null | |
| `audience` | enum | |
| `plan_tiers` | string[] | |
| `start_at` | ISO-8601 | |
| `end_at` | ISO-8601 | |
| `is_active` | bool | |
| `priority` | int | |
| `created_at` | ISO-8601 | Read-only |
| `updated_at` | ISO-8601 | Read-only, auto-touched on UPDATE |
| `created_by` | string | Admin id from auth context |
| `updated_by` | string \| null | Last admin to patch |
| `status` | enum | Computed: `scheduled` \| `live` \| `expired` \| `disabled` |

### 3.4 ReleasePopupPublicResponse (public response)

Subset returned by `GET /v2/release-popups/active`. Audience/plan/audit fields are intentionally hidden from the client.

```json
{
  "id": "uuid",
  "title": "string",
  "body": "string (markdown)",
  "image_url": "string|null",
  "cta_label": "string|null",
  "cta_url": "string|null",
  "priority": 0,
  "end_at": "ISO-8601"
}
```

### 3.5 Enums

**`audience`**

| Value | Who sees it |
|---|---|
| `all` | Every logged-in user |
| `free` | Users on the free plan |
| `paid` | Users on any paid plan |
| `specific` | Users whose `plan_name` is in `plan_tiers` |

**`status`** (computed, read-only)

| Value | Meaning |
|---|---|
| `scheduled` | `is_active=true` AND `now < start_at` |
| `live` | `is_active=true` AND `start_at <= now < end_at` |
| `expired` | `now >= end_at` |
| `disabled` | `is_active=false` |

**Plan slugs** (valid values inside `plan_tiers`)

```
starter, pro, pro_creative, max
```

(Free users targeted via `audience=free`, not via `plan_tiers`.)

---

## 4. Error responses

All errors return JSON:

```json
{ "detail": "Human-readable message" }
```

| Code | Meaning | Common causes |
|---|---|---|
| `400` | Validation error | CTA pair mismatch, empty `plan_tiers` when specific, `end_at <= start_at` |
| `401` | Missing/invalid credentials | No `X-Admin-Api-Key` header, no JWT |
| `403` | Authenticated but not admin | JWT user not in `ADMIN_USER_IDS` |
| `404` | Popup not found | Bad UUID, or already hard-deleted (should never happen — soft delete only) |
| `500` | Server error | Generic — check server logs |

---

## 5. Behaviour & guarantees

### Selection logic (`GET /active`)

Server picks the popup matching this filter chain:

```
is_active = true
  AND now() within [start_at, end_at)
  AND audience matches user
    audience='all'                              → matches any user
    audience='free'                             → user has no sub OR plan_name='free'
    audience='paid'                             → user has sub AND plan_name != 'free'
    audience='specific' AND tier in plan_tiers  → matches when user.plan_name is in the list
ORDER BY priority DESC, created_at DESC
LIMIT 1
```

### Cache

Server caches the list of in-window rows in Redis for 60 seconds. Admin writes (`POST`/`PATCH`/`DELETE`) invalidate the cache immediately, so worst-case publish-to-rollout delay is ≤60s.

### Audit

Every admin write emits an entry in the `admin.audit_log` table (SOC 2 trail): `create`, `update`, `soft_delete` actions with `resource_type='release_popup'`.

### Soft delete

`DELETE` only sets `is_active=false`. Row is preserved. Use `PATCH { "is_active": true }` to re-enable.

### Client dismissal

The main webapp tracks dismissal in `localStorage` keyed by popup `id` (`he2_release_popup_dismissed:<id>`). The backend does **not** track per-user dismissal — admin should not assume server knows who has seen what.

To force re-display to users who dismissed, create a **new popup row** (new `id`); editing an existing row will not re-show it to users who already dismissed that id.

---

## 6. Quickstart — admin webapp checklist

1. Set `ADMIN_API_KEY` env var in your admin app.
2. Wrap fetch calls with the `X-Admin-Api-Key` header.
3. List page → `GET /v2/admin/release-popups` with `is_active`, `active_now`, `audience` filters.
4. Create form → `POST /v2/admin/release-popups` with `ReleasePopupCreate`.
5. Edit form → `GET /{id}` to prefill, `PATCH /{id}` to save.
6. Disable button → `DELETE /{id}` (soft delete).
7. Re-enable → `PATCH /{id}` with `{ "is_active": true }`.
8. Status badge → use the server-computed `status` field directly.

---

## 7. cURL examples

```bash
# Create
curl -X POST "$BASE_URL/v2/admin/release-popups" \
  -H "X-Admin-Api-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Feature: Voice Mode",
    "body": "**Voice Mode** is now live. Try it from any chat.",
    "image_url": "https://cdn.example.com/voice.png",
    "cta_label": "Try it",
    "cta_url": "https://app.he2.ai/voice",
    "audience": "paid",
    "plan_tiers": [],
    "start_at": "2026-05-25T00:00:00Z",
    "end_at": "2026-06-01T00:00:00Z",
    "is_active": true,
    "priority": 5
  }'

# List currently-live
curl -H "X-Admin-Api-Key: $KEY" \
  "$BASE_URL/v2/admin/release-popups?active_now=true"

# Update priority
curl -X PATCH "$BASE_URL/v2/admin/release-popups/$ID" \
  -H "X-Admin-Api-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"priority": 20}'

# Disable (soft delete)
curl -X DELETE "$BASE_URL/v2/admin/release-popups/$ID" \
  -H "X-Admin-Api-Key: $KEY"

# Public — what the webapp calls
curl -b cookies.txt "$BASE_URL/v2/release-popups/active"
```
