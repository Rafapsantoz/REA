# Demand Organizer (Trello-style board) — Plan

## Context

You want a Trello-like organizer for your "demands": a category sidebar (Work / Personal /
Financial), a Kanban board with Pending / In Progress / Done / Overdue, and four time views
(Daily, Weekly, Monthly, Long-term), behind a login page.

Two decisions from you shape this plan:

1. **This platform runs React/Vite frontends only — it cannot host Django/Python.** You chose to
   keep Django for later and build the UI now with **browser localStorage** persistence.
   Consequences to be explicit about:
   - The login is a **local demo login, not real security** (a password hash stored in the browser
     can be bypassed by anyone with devtools). It exists so the flow and screens are real and so the
     Django/Enter Cloud swap later is a drop-in.
   - All data lives in this browser only; nothing is shared or synced.
2. **Table names mirror your DBeaver diagram 1:1** (`list_doapp`, `categories_doapp`, `users`), so
   the same columns map straight onto your existing Postgres schema later. Finance tables
   (`transactions_fapp`, `cards_fapp`, `owners_fapp`, `type_fapp`) are out of scope; "Financial" is
   just a category of demands.

App name in the UI: **Momentum** (one-line change to rename).

## Data model (mirrors `appdb` in your diagram)

Persisted as one versioned JSON document under the key `doapp.db.v1`, shaped exactly like the
tables so a real backend can replace the storage layer without touching components.

| Table | Columns | Notes vs your diagram |
| --- | --- | --- |
| `users` | `id`, `name`, `email`, `password_hash`, `register_dt`, `last_login`, `updated_dt`, `fg_logged` | your `password` is stored as a **SHA-256 hash**, never plaintext; `email` added because login needs an identifier |
| `categories_doapp` | `id`, `description` | unchanged; seeded with Work, Personal, Financial |
| `list_doapp` | `id`, `description`, `category_id` (FK), `link`, `user_id` (FK), `initial_dt`, `deadline`, `status`, `horizon` | `status` = `pending` \| `in_progress` \| `done`; **`horizon` = `daily` \| `weekly` \| `monthly` \| `long_term` is the one added column**, required for your four views — add it to the Django model later |

Derived rules (computed, never stored):

- **Overdue** = `deadline < now` AND `status !== 'done'`. This gives you the 4th Kanban lane
  without a fake "overdue" status value, and it clears itself when the task is completed.
- **Horizon suggestion** from the deadline, used to pre-fill the field (you can override it):
  today → `daily`; later this week → `weekly`; later this month → `monthly`; beyond → `long_term`;
  no deadline → `long_term`.

## Architecture

Storage/domain logic is isolated from UI so the Django swap later touches only the storage layer.

- `src/types/doapp.ts` — `Users`, `CategoriesDoapp`, `ListDoapp`, `TaskStatus`, `Horizon` types.
- `src/lib/local-db.ts` — read/write/watch the versioned localStorage document, id sequencing
  (`Users`/`CategoriesDoapp`/`ListDoapp` helpers), safe parse fallback to empty DB.
- `src/lib/seed.ts` — first-run seed: the 3 categories, a demo account (`demo@momentum.app` /
  `demo1234`), a handful of example demands (removable).
- `src/lib/auth.ts` — register / login / logout / session persistence, SHA-256 via Web Crypto.
- `src/lib/demands.ts` — `isOverdue`, `suggestHorizon`, `filterDemands`, `groupByStatus`,
  deadline formatting/sorting helpers.
- `src/hooks/use-auth.tsx` — auth context + `useAuth()`; `src/hooks/use-demands.ts` and
  `src/hooks/use-categories.ts` — react-query (already installed) over the storage layer, so
  mutations invalidate and reload consistently.
- `src/components/route-guard.tsx` — redirects to `/login` when there is no session.

UI (reusing existing shadcn primitives: button, input, label, dialog, select, dropdown-menu,
badge, scroll-area, textarea, calendar + popover, sonner):

- `src/pages/login/index.tsx` + `LoginForm.tsx` / `RegisterForm.tsx` — split panel: brand side +
  login/register form with validation (zod + react-hook-form, both installed).
- `src/components/app-sidebar.tsx` — brand, category list with counts + "new category" inline form,
  view list (Daily / Weekly / Monthly / Long-term / All) with counts, user footer with logout.
- `src/pages/board/index.tsx` (+ `BoardHeader.tsx`, `BoardView.tsx`) — shell: sidebar + header
  (search, "New demand") + board. Filters live in the URL (`?view=daily&category=3`) so refresh and
  links keep state.
- `src/components/kanban/{kanban-board,kanban-column,demand-card}.tsx` — 4 lanes; drag and drop with
  `@dnd-kit/core` (new dependency: pointer + keyboard sensors, works on touch), plus a "Move to"
  dropdown on each card for mobile and accessibility. Dropping into Overdue is blocked (derived);
  moving a card out of Overdue sets the new status.
- `src/components/demand-dialog.tsx` — create/edit/delete a demand: description, category, link,
  deadline (date + optional time), horizon (auto-filled from the deadline, editable), status.
- `src/router.tsx` — add `/login` and `/board`; `/` redirects to `/board` when logged in, else
  `/login`. `src/pages/Index.tsx` is replaced by that redirect.
- `CodeGuideline.md` — update the module list (it is required to stay current).

Design (via the `designer` agent, then applied to the design system, not inline styles): a
productivity-app palette with distinct accent per status lane, semantic tokens
(`--primary`, `--accent`, `--gradient-*`, `--shadow-*`, lane colors, `--radius`) added to
`src/index.css` and exposed through `tailwind.config.ts`, light + dark mode. No hardcoded
`text-white`/`bg-white`; lucide-react icons only, no emoji. Responsive: sidebar collapses to a
drawer under `md`, board scrolls horizontally, cards stay tappable.

Scope note: the new UI is English-only. Multi-language was not requested, so no new i18n keys are
added (existing `public/locales/*.json` are left untouched).

## Implementation checklist

- [x] Design tokens (lane colors, gradients, shadows, radius) added to `src/index.css` +
      `tailwind.config.ts` for light and dark mode.
- [x] `src/types/doapp.ts` defines `Users` / `CategoriesDoapp` / `ListDoapp` with the column names
      from the diagram, plus `TaskStatus` and `Horizon`.
- [x] `src/lib/local-db.ts` loads/saves `doapp.db.v1`, survives corrupt JSON, and never loses
      unrelated tables on a single-table write.
- [x] `src/lib/seed.ts` seeds Work / Personal / Financial, the demo account, and example demands
      exactly once (separate `doapp.seed.v1` flag, so later deletions never re-create them).
- [x] `src/lib/auth.ts` stores `password_hash` (SHA-256) and never plaintext; login updates
      `last_login` and `fg_logged`; logout clears the session.
- [x] `src/lib/demands.ts` implements `isOverdue` (deadline < now AND status !== done) and
      `suggestHorizon` (today / this week / this month / beyond / no deadline).
- [x] `src/hooks/use-auth.tsx` exposes session + login/register/logout, with the session restored
      from storage on reload.
- [x] `src/hooks/use-demands.ts` + `use-categories.ts` read/write through the storage layer and
      refresh the board after every mutation.
- [x] `route-guard.tsx` redirects unauthenticated visitors to `/login` and keeps `/board` for
      logged-in users.
- [x] `/login` renders login **and** register forms, with field validation and a clear error on
      wrong credentials; success lands on `/board`.
- [x] Sidebar lists the three seeded categories with per-category counts, "All", and the four time
      views, each filtering the board via URL params.
- [x] Adding a category is possible from the sidebar; deleting one with demands is blocked with an
      explanatory toast.
- [x] Board renders the four lanes Pending / In Progress / Done / Overdue with per-lane counts and
      an empty state per lane.
- [x] Dragging a card between lanes persists the new `status`; the Overdue lane rejects drops
      (`useDroppable` disabled for the derived lane).
- [x] Every card shows description, category, deadline (compact), link icon when a `link` exists,
      and an overdue emphasis; a "Move to" menu changes status without dragging.
- [x] `demand-dialog.tsx` creates, edits, and deletes a demand; changing the deadline pre-fills
      `horizon`, and an explicit horizon choice is not overwritten afterwards.
- [x] Overdue marking disappears immediately when a demand is moved to Done (derived, not stored).
- [x] `/` redirects per session, `CodeGuideline.md` lists every new module, and i18n locale files
      are unchanged.

## Verification checklist

- [x] `pnpm lint` passes and `pnpm exec tsc --noEmit` reports no errors.
- [x] `pnpm run build` completes.
- [x] Positive: signing in with the demo account lands on `/board` with the seeded demands, and the
      board renders all four lanes with the expected counts.
- [x] Positive: view filtering (`?view=daily`), category filtering (`?category=2`), and search
      (`?q=dentist`) each narrow the board; the header shows the active category chip.
- [x] Negative/default: visiting `/board` while signed out redirects to `/login` (confirmed in the
      preview with no stored session).
- [x] Boundary: the past-due Personal demand renders in Overdue with "2d overdue" and the amber
      card treatment; a demand without a deadline sits in Pending with no deadline label.
- [x] Boundary: per-lane empty states render with icon + copy, and the whole-board empty state
      renders with its CTA.
- [x] Responsive: `/login` and `/board` verified at `mobile_390` and `desktop_1280` (target device
      was not specified) — sidebar collapses to a drawer trigger, board scrolls horizontally.

### Not verified by interaction (needs a manual click-through)

- [ ] Drag a card between lanes / drag into Overdue (no drops accepted) — implemented with dnd-kit
      sensors (mouse distance 6px, touch 150ms delay, keyboard), not driven in this session.
- [ ] Create / edit / delete a demand through the dialog, and delete a category that still has
      demands (expected: refusal toast, demands untouched).
- [ ] Register a new account (expected: empty board, since seeded example demands belong to the
      demo user) and sign out.
- [ ] Category delete/overflow affordances that only appear on hover with a real pointer.
- [ ] Light/dark parity: only light mode was rendered (there is no theme toggle in the app, so the
      dark token block is unreachable at runtime).
