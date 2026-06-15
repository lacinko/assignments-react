# Assignment Solution Plan

This document walks through every task in [README.md](README.md). For each one it states
**what the actual problem is** (grounded in the current code) and **how to solve it**.

## Project map

| Area | Path | Notes |
| --- | --- | --- |
| Client app entry | [client/src/App.tsx](client/src/App.tsx) | Currently static — no data layer. |
| UI components | [client/src/components/](client/src/components/) | Treat as **pure** presentational components. Do **not** change their props (README restriction). |
| Form components | [client/src/components/form/](client/src/components/form/) | `Form` + `Input`, already controlled. |
| Stories | `client/src/components/**/stories/` | Storybook CSF3. |
| Server | [server/server.js](server/server.js), [server/db.json](server/db.json) | `json-server`, single `/items` resource on `http://localhost:3000`. |

**Data shape** (from [server/db.json](server/db.json)):

```ts
type TodoItem = {
    id: number;
    label: string;
    isDone: boolean;
    createdAt: number;   // epoch ms, set by server on POST
    finishedAt?: number; // added by S1
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
**Fix.** Add an API client (`getItems(): GET /items`) and load on mount. Recommended structure:
- `src/api/todos.ts` — thin `fetch` wrapper around `http://localhost:3000/items`.
- `src/hooks/useTodos.ts` — holds `items`, `loading`, `error`; runs the fetch in `useEffect`.
- `App.tsx` maps items to `<ListItem>` inside `<List>`.
Use `import.meta.env` / a constant for the base URL. Handle loading + error states.

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
Then in the client (F5), call `PATCH /items/:id/done` when marking an item done. Add `finishedAt?`
to the `TodoItem` type.

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