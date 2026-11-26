# ADR-0001: Automatic IP-First Timezone Detection via Same-Origin Cloudflare Worker & Server UTC Clock Sync

- **Status:** Accepted (Gate 2 PASS on 2026-11-25)
- **Date:** 2026-11-25
- **Task:** `tasks/2026-11-25-flexible-timezone-countdown`

## Context

PEDS previously mixed hardcoded Vietnam time (`UTC+7` via `toVietnamTime` in `RaceCalendar.tsx`), hardcoded `'UTC'` (`HomeRaceControl.tsx`), a dead `"vietnam"` check (`WeekendResults.tsx`), and a manual 9-option dropdown (`TimezoneSelector.tsx`). Countdowns also relied exclusively on the client device clock (`Date.now()`), which drifts when a visitor's system clock is incorrect.

The owner requested 100% automatic global UTC timezone detection (supporting all UTC offsets worldwide with zero manual user timezone selection) and accurate countdown figures while preserving the repository's strict security headers (`Permissions-Policy: camera=(), microphone=(), geolocation=()` and `Content-Security-Policy: connect-src 'self'`).

## Decision

1. Add a lightweight, read-only, same-origin Cloudflare Worker endpoint (`GET /api/timezone`) that reads `request.cf?.timezone` in-memory, validates it as an IANA timezone identifier, and returns `{ timeZone, source, serverTimeUtc, serverEpochMs }` with `Cache-Control: no-store` and zero raw IP echo/logging/storage.
2. Initialize the shared frontend `useTimezoneStore` synchronously with the browser's validated `Intl` IANA timezone (fallback `'UTC'`), clear legacy `localStorage["peds-timezone"]` manual overrides, and execute a single-flight asynchronous upgrade from `/api/timezone` (timeout `3000ms`) that upgrades the active timezone when edge IP metadata is present and computes an NTP-midpoint `clockOffsetMs` from `serverEpochMs` for all countdown timers.
3. Remove all manual timezone selection UI (`<TimezoneSelector>`), remove hardcoded `UTC+7`/`UTC` formatting from production schedule components, and display a compact read-only `<AutoTimezoneBadge />`.

## Considered Alternatives (and Why Rejected)

1. **Browser GPS (`navigator.geolocation`) + coordinate-to-timezone lookup:**
   - *Rejected:* Triggers intrusive browser location permission popups (high denial rate), requires relaxing `Permissions-Policy: geolocation=()` in `apps/web/public/_headers` and `apps/api/src/worker.ts`, and would require either bundling a large timezone-polygon dataset or calling an external API.
2. **Direct client calls to a third-party IP geolocation API (e.g., `ipapi.co`, `ipinfo.io`):**
   - *Rejected:* Violates `connect-src 'self'` CSP, introduces external vendor availability/rate-limit/cost risk, and leaks visitor IPs to third parties.
3. **Browser `Intl` timezone only (no server endpoint):**
   - *Rejected:* Cannot fulfill IP-based timezone detection when a device timezone differs from network location, and cannot correct client system-clock skew on countdown timers (`serverTimeUtc`).

## Consequences

- **Positive:** Zero browser permission prompts, zero external network origins, zero CSP/Permissions-Policy weakening, zero new npm dependencies, sub-millisecond edge execution, full coverage of all global IANA/UTC offsets (including fractional offsets and DST), and countdown immunity to client clock skew.
- **Negative / Trade-offs:** Visitors on VPNs see schedules in their VPN exit node's timezone because manual selection is intentionally disabled; local dev without Cloudflare edge headers exercises the `device` fallback path rather than live IP geolocation.
- **Revisit condition:** If the owner later requests an optional manual override for VPN/travelers, re-introducing a secondary preference layer on top of `useTimezoneStore` is additive and does not break `/api/timezone`.
