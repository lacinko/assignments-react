# Assignment Solution & Decisions

This document is the written record the assignment asks for:
- **Key solutions and decisions** + reasoning in the complex areas — see
  [Key decisions & reasoning](#key-decisions--reasoning-complex-areas).
- **Agentic approach, tooling, and process** — see
  [Agentic development process](#agentic-development-process).
- A **per-task breakdown** (what the problem was, how it was solved) — the rest of the document.

All tasks (B1–B2, F1–F9, UI1–UI3, SB1–SB3, S1) are implemented. Each was delivered as an
**atomic commit whose message carries the task id** (e.g. `F4: edit todo label via inline Form …`);
run `git log --oneline` to see the mapping. Verification: `tsc --noEmit`, `vite build`, and the
`vitest` suite all pass, the S1 endpoint was exercised directly with `curl`, and the full app was
QA'd end-to-end in a headless browser (load, add/edit/complete/un-complete/delete, plus the
server-down failure path). (`pnpm lint` is clean against the project's `.eslintrc.cjs`, but note
that ESLint 9 needs `ESLINT_USE_FLAT_CONFIG=false` to read the legacy eslintrc — a pre-existing
repo-config quirk, unrelated to the solution code.)

The data layer was subsequently migrated from a hand-rolled `fetch` client + `useState` to
**Redux Toolkit Query** to match the team's stack (Redux Toolkit, Vitest) — see decision #2.

**Time spent: ~4 hours total** — reading the codebase and planning, implementing all tasks,
the post-implementation self-review, and the follow-up robustness hardening (mutation error
handling + `finishedAt` type) described in decision #8 below.

The sections below state, for each task, **what the actual problem was** (grounded in the original
code) and **how it was solved**.

## Project map

| Area | Path | Notes |
| --- | --- | --- |
| Client app entry | [client/src/App.tsx](client/src/App.tsx) | Thin wiring layer over `useTodos`. |
| Data layer | [client/src/store/](client/src/store/) | RTK Query `todosApi` slice + store; `useTodos` integrates it. |
| Sort util | [client/src/lib/sortTodos.ts](client/src/lib/sortTodos.ts) | F7 ordering, pure + unit-tested. |
| UI components | [client/src/components/](client/src/components/) | Treat as **pure** presentational components. Do **not** change their props (README restriction). |
| Form components | [client/src/components/form/](client/src/components/form/) | `Form` + `Input`, already controlled. |
| Stories / Tests | `client/src/**/stories/`, `client/src/**/*.test.*` | Storybook CSF3; Vitest suite. |
| Server | [server/server.js](server/server.js), [server/db.json](server/db.json) | `json-server`, single `/items` resource on `http://localhost:3000`. |

**Data shape** (from [server/db.json](server/db.json)):

```ts
type TodoItem = {
    id: number;
    label: string;
    isDone: boolean;
    createdAt: number;        // epoch ms, set by server on POST
    finishedAt?: number | null; // added by S1; null once un-completed, absent before first completion
};
```

### Hard constraints (from README)
- Do **not** modify the props (public API) of the provided components.
- No component library (MUI etc.), no Tailwind.
- Atomic commits; put the task id in each commit message (e.g. `B1: ...`).
- Document the agentic approach/tooling separately.

### Suggested overall approach
The provided components are pure/presentational. The missing piece is a **stateful container**
(in `App.tsx` or a `TodoApp` component + a small API client + a `useTodos` hook) that:
fetches items, holds them in state, and passes data + callbacks down. Most Feature tasks are
"wire this callback to the API and update state". Build that data layer first (F2), then the
mutations (F3–F6) fall out naturally.

---

## Key decisions & reasoning (complex areas)

These are the non-obvious choices made while implementing. The straightforward tasks (CSS
alignment, default props, counts) are documented inline in the per-task sections below.

### 1. Where the add/edit toggle state lives (F3, F4) — the main design decision
**Constraint tension.** The README says *"Do not modify the API (props) of the provided
components"*, yet F3/F4 require toggling the `Header`'s add button ↔ a `Form`, and the
`ListItem`'s edit button ↔ a `Form`. `Header` only exposes `onItemAdd(label)` and `ListItem` only
exposes `onItemLabelEdit(label)` — there is no `onAddClick`/`isEditing` prop to drive a toggle from
the parent.

**Decision.** Keep the toggle as **local view state inside `Header`/`ListItem`** (`useState`), and
call the existing `onItemAdd` / `onItemLabelEdit` props on submit.

**Reasoning.** This respects the literal restriction — the **prop signatures are untouched**, so the
components remain drop-in compatible. It also matches the README's own split: the components stay
responsible for *visual representation and view state*, while *data manipulation/persistence* lives
in the container (`useTodos`). The alternative — adding an `isAdding`/`onToggle` prop — would change
the public API and was rejected. Trade-off: a sliver of UI state now lives in otherwise-pure
components, which I judged acceptable because it is purely presentational (open/closed), not data.

### 2. Container architecture: RTK Query slice + one `useTodos` hook (F2–F8)
Server state lives in a **Redux Toolkit Query** slice,
[`todosApi`](client/src/store/todosApi.ts): a `getItems` query plus `addItem`/`editLabel`/
`setDone`/`deleteItem` mutations, all sharing one `Todos` cache tag so every mutation
auto-invalidates and refetches the list. [`useTodos`](client/src/hooks/useTodos.ts) is a thin
integration layer over the generated hooks that keeps the exact shape `App` already consumed
(sorted items, counts, mutation callbacks), so the pure presentational components stayed
**completely untouched**. `App` remains a thin wiring layer.

**Reasoning.** This is the team's own stack (Redux Toolkit). RTK Query subsumes what was
previously hand-rolled — loading/error state, the manual `upsert`, and cache bookkeeping — with
declarative cache invalidation, and is exercised end-to-end by the Vitest suite. The earlier
version centralized the same logic in `useTodos` over a `fetch` client in `api/todos.ts`; the
migration preserved the public hook contract, so it was a drop-in swap behind `App`. Sorting (F7)
and counts (F8) remain **`useMemo`-derived** from the cached `items` array (in
[`lib/sortTodos.ts`](client/src/lib/sortTodos.ts), unit-tested) — deriving rather than storing
avoids state that can drift out of sync.

### 3. Using the S1 endpoint only for the "done" direction (F5)
`setDone(id, isDone)` calls the custom `PATCH /items/:id/done` endpoint **only when marking done**
(so the server stamps `finishedAt`), and falls back to a generic `PATCH { isDone:false,
finishedAt:null }` when un-checking. **Reasoning:** S1 is defined as a one-way "mark as done"
operation; un-completing is not part of its contract, so I didn't overload it.

### 4. State updates from server responses, not optimistic guesses
Every mutation (`add/editLabel/toggleDone`) updates local state from the **object the server
returns** (via a shared `upsert`), and `delete` removes by id after the request resolves.
**Reasoning:** the server owns `id`, `createdAt`, and `finishedAt` — trusting the response keeps the
client authoritative-source-of-truth correct without re-fetching the whole list. Trade-off: no
optimistic UI; given the local json-server latency this is invisible and far simpler/safer.

### 5. `CheckedState` → strict boolean (F5)
Radix's `onCheckedChange` emits `boolean | "indeterminate"`, but `onItemDoneToggle` expects a
`boolean`. Coerced with `checked === true` at the boundary so `"indeterminate"` can never leak into
the data layer.

### 6. Mutation failures surface instead of being swallowed (post-review hardening)
Originally `addItem/editLabel/toggleDone/deleteItem` were `async` with no `.catch`. The initial
load surfaced errors, but a **failed mutation** (e.g. the server going down mid-session) silently
did nothing *and* produced an unhandled promise rejection. They now run through a shared
[`runMutation`](client/src/hooks/useTodos.ts) helper that captures failures into the existing
`error` state and clears stale errors on success. [`App`](client/src/App.tsx) renders the alert
**above the still-visible list** rather than blanking it, so a transient failure doesn't wipe the
UI. **Reasoning:** this was the one real correctness gap from the self-review — an unhandled
rejection is never acceptable, and a try/catch into the existing error channel is the minimal
correct fix (no new toast/retry infrastructure needed). Verified in-browser by killing the API
mid-session: the alert appears, no unhandled rejection fires, and a retry after restart clears it.

### 7. Bugs fixed beyond the listed ones (README invites this)
- `Footer` rendered `Done: {todoItems}` — wrong variable; both counters showed the todo count.
- `ListItem` actions were **swapped/dead**: the trash button had no handler and the pencil button
  called `onItemDelete`. Edit and delete now do what their icons say.
- Mistyped exported type `LiteeItemProp` → `ListItemProps` (and references updated).
- Removed unused `React` imports and the ignored-then-reintroduced `onItemAdd` wiring.
- Repo-wide: stories imported the renderer package `@storybook/react` directly, which the Storybook
  9 eslint plugin forbids; switched to `@storybook/react-vite` so `pnpm lint` is clean.

### 8. Out of scope / deliberately not done
- **No optimistic updates; no toast/retry system** — load *and* mutation errors are surfaced as
  simple inline alert text in `App` (see #6). Enough for the assignment; a production app would add
  dismissible toasts, retry (trivial to add now via RTK Query's `refetch`/optimistic
  `onQueryStarted`), and per-row error affordances.
- **`react-hook-form` + `zod` not adopted** — both are on the team's stack and would be my choice in
  a larger app (RHF for form state, a zod schema to validate the label *and* parse the server
  response at the transport boundary). Here the `Form` is a single controlled input and the data
  shape is fixed, so adding them earns little over the current controlled component; I left them out
  deliberately rather than from unfamiliarity. RTK Query was the higher-value stack adoption and was
  done (decision #2).

### 9. Tests (Vitest)
A focused [Vitest](https://vitest.dev/) suite covers the parts most worth protecting:
- [`lib/sortTodos.test.ts`](client/src/lib/sortTodos.test.ts) — the F7 ordering rule (todo-before-done,
  then `createdAt` desc) and that it doesn't mutate its input. Pure, no mocks.
- [`hooks/useTodos.test.tsx`](client/src/hooks/useTodos.test.tsx) — drives the real RTK Query
  transport against an in-memory `fetch` stand-in: load + sort + derived counts (F2/F7/F8), a load
  failure surfacing into `error` (decision #6), and `addItem` performing a POST and reflecting the
  new item after cache invalidation/refetch (F3).
Run with `pnpm test` (`vitest run`) or `pnpm test:watch`. The data layer is structured so the
remaining mutations are straightforward to add in the same style.

---

## Agentic development process

The README asks how the AI was *directed*, not how much was used. Summary of the workflow:

- **Tooling.** Claude Code (Opus 4.8) as the agent, driving the local toolchain (file edits, `git`,
  `tsc`, `eslint`, `vite build`, `curl` against the running json-server).
- **Read-before-write.** First action was reading the full README, both client/server `README`s,
  and **every component + CSS module** before writing anything — so the plan was grounded in the
  actual code (which surfaced the swapped handlers and the `Done`-counter bug that aren't in the
  task list).
- **Plan first, then execute.** This very document was produced as a plan (problem → approach per
  task) and reviewed before implementation, then updated to reflect the as-built decisions.
- **Explicit task tracking.** A todo list mirrored the README task ids; one item in progress at a
  time, driving the **build order**: S1 → data layer → component wiring → derivations → styling →
  Button/stories.
- **Atomic, task-tagged commits.** Each task (or tight cluster) is its own commit with the id in the
  subject line, as the README requests — easy to review task-by-task.
- **Verify continuously.** Typecheck/lint after risky edits; the S1 endpoint tested with `curl`
  (including the 404 path); a full production `vite build` as the final gate.
- **Self-review + live QA loop.** After the first pass, a self-review flagged two issues (swallowed
  mutation errors, the `finishedAt` type). These were fixed (decision #6) and then validated by
  driving the running app in a headless browser — every CRUD flow plus the **server-down failure
  path** — rather than trusting the diff alone.
- **Direction over autopilot.** Key judgment calls (the F3/F4 prop-constraint tension, the S1
  one-way semantics) were decided explicitly and recorded above rather than left to the model's
  default — these are the points discussed in the section above.

---

## Bugs

### B1 — `List` content alignment
**Problem.** [List.module.css](client/src/components/List.module.css) is only `display:flex; flex-direction:column;`.
A non-empty list has no spacing/alignment, so items are cramped and content isn't laid out cleanly.

**Fix.** In `List.module.css` give the column proper layout — e.g. `gap` between items, full
width, and align children to stretch. Verify against the `List` story with several `ListItem`s.

### B2 — `Footer` always pinned to the bottom
**Problem.** [Layout.module.css](client/src/components/Layout.module.css) is a flex column with
`min-height:50vh`, but nothing in it grows. The `List` only takes its content height, so when
there are few items the `Footer` floats up directly under the list instead of sitting at the
bottom of the layout.

**Fix.** Make the content area absorb the free space. Either give `List` `flex: 1 1 auto`
(so it grows and pushes the footer down) or add `margin-top: auto` on the footer. Preferred:
list grows, since the list is the scrollable/expanding region.

### Other bugs / visual imperfections (the README explicitly asks to fix these too)
- **Footer wrong variable** — [Footer.tsx](client/src/components/Footer.tsx) renders
  `Done: {todoItems}` instead of `{doneItems}`. Both counters currently show the todo count.
- **`ListItem` actions are swapped/dead** — in [ListItem.tsx](client/src/components/ListItem.tsx)
  the **Trash** button has no `onClick`, and the **Pencil (edit)** button calls `onItemDelete()`.
  Edit must open the edit form (F4) and delete must call `onItemDelete` (F6).
- **Footer spacing** — `Footer.tsx` puts the two counters adjacent with no separator; they'll
  render as `Todo: 0Done: 0`. Add spacing/structure (ties into F1/F8).
- **Type typo** — `ListItem` prop type is named `LiteeItemProp`; rename to e.g. `ListItemProps`
  (internal, doesn't change the public prop shape).
- **Unused imports / `onItemAdd` ignored** — [Header.tsx](client/src/components/Header.tsx)
  destructures only `children` and drops `onItemAdd`; several files import `React` without using
  it. Clean these up (eslint `--fix`).

---

## Features

### F1 — Default values in `Footer`
**Problem.** `todoItems`/`doneItems` are optional; when undefined the JSX renders nothing.
**Fix.** Default to `0`: `const { todoItems = 0, doneItems = 0 } = props;` (or `todoItems ?? 0`
at render). Fix alongside the `doneItems` bug above.

### F2 — Load todo items
**Problem.** [App.tsx](client/src/App.tsx) renders `<List />` with no children and no fetching.
**Fix.** An RTK Query `getItems` query loads `GET /items` (the slice's `<Provider>` is wired in
[main.tsx](client/src/main.tsx)); [`useTodos`](client/src/hooks/useTodos.ts) exposes the query's
`data`/`isLoading`/`error`, and `App` maps the sorted items to `<ListItem>` inside `<List>`. The
base URL comes from `import.meta.env.VITE_API_URL` (default `http://localhost:3000`). Loading and
error states are handled in `App`.

### F3 — Add a todo item
**Problem.** The "add" button in `Header` does nothing; there's no toggle to a `Form`.
**Fix.** Container state `isAdding`. When the add button is clicked, show the `Form` (with
`initialValue=""`) in place of / next to the header button; on submit `POST /items` with
`{ label, isDone: false }` (server stamps `createdAt`), then append the returned item to state
and hide the form; on cancel just hide it. Note `Header.onItemAdd(label)` is the existing prop to
wire the submit through.

### F4 — Edit a todo item's label
**Problem.** No edit toggle; the edit button is currently mis-wired to delete.
**Fix.** Per-item `editingId` state (or local state in a small wrapper). Clicking the pencil swaps
the `ListItem` row for a `Form` pre-filled with the current label (`initialValue={label}`). On
submit `PATCH /items/:id` with `{ label }`, update state, exit edit mode; cancel reverts.

### F5 — Complete a todo item
**Problem.** `Checkbox` `onCheckedChange` isn't wired to persistence; Radix passes
`CheckedState` (`boolean | "indeterminate"`), not a plain boolean.
**Fix.** On toggle, coerce to boolean and `PATCH /items/:id` with `{ isDone }`. Once **S1** exists,
use the custom done endpoint when marking done (so `finishedAt` is set). Update state from the
response.

### F6 — Delete a todo item
**Problem.** Trash button has no handler.
**Fix.** Wire the trash button to `onItemDelete`, container calls `DELETE /items/:id`, then remove
it from state. (Fixing the swapped handlers from B1 covers the wiring.)

### F7 — Sort the todo items
**Problem.** No ordering is applied.
**Fix.** Sort a derived copy before rendering: not-done first, then by `createdAt` descending.
```ts
const sorted = [...items].sort((a, b) =>
    Number(a.isDone) - Number(b.isDone) || b.createdAt - a.createdAt
);
```
Compute with `useMemo`. Keep sorting in the view layer, not on the server.

### F8 — Count the todo items
**Problem.** Footer has no real counts.
**Fix.** Derive `doneCount = items.filter(i => i.isDone).length` and `todoCount = items.length - doneCount`;
pass to `Footer` as `doneItems`/`todoItems`. Combined with F1 this fully fixes the footer.

### F9 — `Button` component
**Problem.** Raw `<button>` elements are scattered across `Header`, `ListItem`, and `Form`.
**Fix.** Create `src/components/Button.tsx` (+ CSS module) — a styled wrapper over the native
`<button>` that forwards `...props` (so `type`, `onClick`, `aria-*` pass through) and supports
variants (e.g. `primary` / `icon` / `ghost`) via a `variant` prop. Replace the raw buttons with it.
This also feeds SB2. (Note: replacing internal markup is fine; you're not changing the **props** of
the provided components, just their internals.)

---

## Styling

### UI1 — `Header` "add" button to the right
**Problem.** [Header.module.css](client/src/components/Header.module.css) `.header` is `display:flex`
with no `justify-content`, so the title and button sit left-to-right with the button next to the title.
**Fix.** `justify-content: space-between; align-items: center;` on `.header` (or `margin-left:auto`
on the button).

### UI2 — `ListItem` actions to the right
**Problem.** In [ListItem.module.css](client/src/components/ListItem.module.css) the row is a flex
line with the label `margin-left:15px`; the action buttons hug the label.
**Fix.** Push actions to the end — give `.label` `flex: 1` (or `margin-right:auto`) so the buttons
align right. Group the two action buttons in a flex container with a small `gap`.

### UI3 — `ListItem` actions visible only on hover
**Problem.** Action buttons are always visible.
**Fix.** Hide the actions by default (`opacity:0` / `visibility:hidden`) and reveal on
`.item:hover` (and `.item:focus-within` for keyboard accessibility). Use `opacity` + `transition`
so it animates and stays focusable.

---

## Stories (optional)

### SB1 — `Layout` story
Add `Layout.stories.tsx` rendering `Layout` with representative children (Header/List/Footer) to
showcase B2 (footer pinned to bottom).

### SB2 — `Button` variants story
After F9, add `Button.stories.tsx` with one story per variant (primary/icon/ghost, disabled, etc.).

### SB3 — `ListItem` hover story
Add a story demonstrating UI3 — actions appearing on hover (CSF3; can note the interaction in the
story description or use a play function/hover interaction).

---

## Server

### S1 — Custom "mark as done" endpoint
**Problem.** `json-server`'s generic `PATCH /items/:id` can set `isDone`, but the assignment wants a
dedicated endpoint that also stamps `finishedAt`.
**Fix.** In [server/server.js](server/server.js), register a custom route **before**
`server.use(router)`:
```js
server.patch("/items/:id/done", (req, res) => {
    const db = router.db;                       // lowdb instance
    const item = db.get("items").find({ id: Number(req.params.id) }).value();
    if (!item) return res.status(404).jsonp({ error: "Not found" });
    const updated = db.get("items")
        .find({ id: Number(req.params.id) })
        .assign({ isDone: true, finishedAt: Date.now() })
        .write();
    res.jsonp(updated);
});
```
Then in the client (F5), call `PATCH /items/:id/done` when marking an item done. The `TodoItem`
type carries `finishedAt?: number | null` — `null` is what the server returns after un-completing
(generic `PATCH { isDone:false, finishedAt:null }`), so the type models that explicitly.

---

## Suggested build order
1. **Server S1** (unblocks F5 done-path).
2. **Data layer F2** (API client + `useTodos` hook) — everything else depends on it.
3. **Wiring fixes** in `ListItem`/`Header` (resolves the swapped/dead handlers from B1) →
   F3, F4, F5, F6.
4. **Derivations** F7 (sort) + F8 (counts) + F1 (footer defaults).
5. **Styling** B1, B2, UI1, UI2, UI3.
6. **F9 Button** refactor, then **stories** SB1–SB3.

Keep commits atomic and tagged with the task id (e.g. `F2: load todo items from server`).