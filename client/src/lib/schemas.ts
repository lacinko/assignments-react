import { z } from "zod";

/**
 * Zod schemas — the single source of truth for both form validation and the
 * transport boundary (decision #8). `TodoItem`/`NewTodoItem` in `types.ts` are
 * inferred from `todoItemSchema`, so the runtime check and the static type can
 * never drift apart.
 */

/** Max label length — keeps a single todo from blowing out the row layout. */
const MAX_LABEL_LENGTH = 200;

/**
 * Validation for the add/edit `Form`'s single label field. `.trim()` is a
 * transform, so a passing submit yields the trimmed label and a
 * whitespace-only entry is rejected by `.min(1)`.
 */
export const labelSchema = z.object({
    label: z
        .string()
        .trim()
        .min(1, "Label cannot be empty")
        .max(MAX_LABEL_LENGTH, `Label cannot exceed ${MAX_LABEL_LENGTH} characters`),
});

export type LabelForm = z.infer<typeof labelSchema>;

/**
 * Shape of a todo item as returned by the server, parsed at the RTK Query
 * transport boundary so a malformed payload fails loudly instead of flowing
 * untyped into the cache. `finishedAt` is `nullish` (S1): `null` once an item
 * is un-completed, absent before it has ever been completed.
 */
export const todoItemSchema = z.object({
    id: z.number(),
    label: z.string(),
    isDone: z.boolean(),
    createdAt: z.number(),
    finishedAt: z.number().nullish(),
});

export const todoItemsSchema = z.array(todoItemSchema);
