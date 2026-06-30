# AI Progress Tracking

## Purpose

- This file stores detailed, chronological AI work logs for this repository.
- Use it for implementation history in the project built from this template.
- Keep long history here, not in `AI_CarryOn.md`.

## Logging Rules

- Add a new entry after each meaningful planning or implementation update.
- Keep each entry concise but specific.
- Include date, summary, files touched, decisions, and next action.
- Before writing a timestamp, get the real current local time from the terminal. On Windows PowerShell, use `Get-Date -Format "yyyy-MM-dd HH:mm:ss K"` and record the local `YYYY-MM-DD HH:mm` value from that output.
- Use newest entries at the bottom (append-only).

## Entry Template

### YYYY-MM-DD HH:mm

- Summary:
- Files touched:
- Decisions:
- Next action:

## Entries

### 2026-06-30 09:43

- Summary: Built Dynamic Link Directory v1 from the template — replaced TemplateItems with `Categories` + `Links` (Sequelize, FK with onDelete SET NULL), public `GET /api/directory`, admin CRUD + reorder, DirectoryPage + AdminPage, branding, seed data.
- Files touched: Backend models/routes/seeds/index, `config.json` (DB → `dld_dev`), Frontend App/config/types/pages, README.
- Decisions: Open admin (no auth) + separate Categories table (per user). `sync.alter` MUST stay `false` (Supabase describeTable bug crashes boot) — created tables via seed; later additive columns via `database/patches.js`.
- Next action: Refinements.

### 2026-06-30 10:30

- Summary: First refinement pass — full user-account auth (Users/Sessions, scrypt, bearer tokens, `fastify.authenticate` guarding category/link routes, default admin seed), drag-and-drop reorder, search/filter, click tracking (`links.click_count` + public click endpoint), category color accent.
- Files touched: `lib/auth.js`, `app/plugins/auth.js`, `app/routes/api/auth.route.js`, models (user/session), `patches.js`, Frontend `auth.ts` + pages.
- Decisions: DB-backed opaque session tokens; token in localStorage; click via `navigator.sendBeacon`.
- Next action: UX/theming refinements.

### 2026-06-30 11:30

- Summary: Directory UX — collapsible categories (per-category `default_expanded`), goto icon-button per link (card body no longer navigates), removed public click counter; per-link `open_in_new_tab`; emoji picker + color picker; masonry fix (`align-items`/multi-column); admin-bar layout fix; picker layout (specificity) fixes.
- Files touched: DirectoryPage, AdminPage, EmojiPicker, ColorPicker, models/patches (`open_in_new_tab`, `default_expanded`), `index.css`.
- Decisions: Clear (×) button moved inside inputs; directory uses CSS multi-column to avoid grid row gaps.
- Next action: Site-level theming + layout selection.

### 2026-06-30 12:06

- Summary: Site settings + theming system. `Settings` key/value table; `GET/PUT /api/settings`. Four admin-selectable dimensions applied live via CSS vars on `document.documentElement`: shell layout (classic/topbar), directory layout (cards/compact/tiles/single/sidebar), accent color (per-layout default), background palette (warm/cool/mint/rose/slate — now also themes panel/card/border/shadow surfaces, not just bg). Visual pickers (Layout/Shell/Palette), toggle switches replacing boolean dropdowns, scoped admin feedback rendered under the action button, "New" buttons moved to list panels, links now require a category (no Uncategorized; new-link category syncs with selected category).
- Files touched: `setting.route.js`, `settings.ts`, `App.tsx`, `DirectoryPage.tsx`, `AdminPage.tsx`, components (LayoutPicker, ShellPicker, PalettePicker, Toggle), `index.css`, `README.md`, AI docs.
- Decisions: Surfaces driven by palette vars; accent shades derived in JS; presets-only palettes (custom deferred). Commits carry NO Claude co-author (recorded in AI_CarryOn).
- Next action: Commit + push; continue refinements as requested.

### 2026-06-30 12:17

- Summary: (a) Made content full-width (removed 1160px cap on app-frame + topbar inner/content). (b) Logo upload: new `site_assets` table (BYTEA blob), `GET/POST/DELETE /api/settings/logo` (public serve / admin upload base64 with 5 MB limit + raised route bodyLimit / admin delete), `has_logo` in settings GET; logo shown center-cropped 1:1 in topbar brand + classic hero; admin upload/preview/remove control. (c) Added a warning under category "Expanded by default" when the sidebar layout is selected (it auto-expands first category by order).
- Files touched: `setting.route.js`, `models/site_asset.model.js` + `models/index.js`, `settings.ts`, `App.tsx`, `AdminPage.tsx`, `index.css`.
- Decisions: Store logo as DB blob (not filesystem) per request; base64-over-JSON upload (no multipart dep) with per-route bodyLimit 8 MB; validate mime + 5 MB server-side (413) and client-side. New table created by `sync` (no patch).
- Verified: has_logo flag, 404 before upload, upload 200 (served as image/png), 401 unauthed, 413 oversize, delete → 404. Full build/type-check clean.
- Next action: Commit + push.

### 2026-06-30 12:27

- Summary: Hardening pass started. Decoupled theme color from layout (separate commit). Then #1 — account + user management: `PATCH /api/auth/password` (verify current, min 6); admin `/api/users` CRUD (`user.route.js`) with last-active-admin protection (can't delete self, delete/deactivate/demote last admin) and duplicate-username 409. Frontend `users.ts` + auth `changePassword`; Admin gained an Account (change password) panel and a Users management section (list + editor, role, active toggle, set/reset password).
- Files touched: `auth.route.js`, `user.route.js`, `app/routes/api/index.js`, `Frontend/src/auth.ts`, `Frontend/src/users.ts`, `Frontend/src/pages/AdminPage.tsx`.
- Verified: list/create/login-as-new/duplicate-409/change-password/wrong-current-400/self-delete-400/delete-200. Build clean.
- Next action: #2 login rate-limiting.

---

## Template Updates

### 2026-05-05 15:16

- Summary: Added `run.bat` at the repository root so users can start the backend from the root directory without changing directories.
- Files touched: `run.bat`, `README.md`, `AI_CarryOn.md`, `AI_ProgressTracking.md`
- Decisions: `run.bat` calls `npm --prefix Backend start`; kept it minimal so it works on any Windows machine with Node installed.
- Next action: Push the update to GitHub.

### 2026-05-05 16:52

- Summary: Fixed backend startup so query log files are only initialized when database support is enabled, and updated docs to match this behavior.
- Files touched: `Backend/server.js`, `Backend/README.md`, `README.md`, `AI_ProgressTracking.md`
- Decisions: Keep query log initialization inside the database-enabled startup branch to avoid creating unused `queries_*.log` files when DB is off.
- Next action: Commit and push the logging behavior fix.

### 2026-06-17 10:41

- Summary: Changed frontend API base URL to automatically use the current origin (window.location.origin) when config.base_url is empty, eliminating the need for manual configuration when backend serves frontend.
- Files touched: `Frontend/src/config.ts`, `Frontend/public/config.json`, `Frontend/public/config.example.json`, `Frontend/README.md`, `README.md`, `AI_ProgressTracking.md`
- Decisions: Default to same-origin API calls since this is the common case when backend serves the built frontend; allow explicit base_url override for cross-origin scenarios.
- Next action: Commit and push the dynamic API base URL feature.