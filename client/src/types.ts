import { z } from "zod";

import { todoItemSchema } from "./lib/schemas";

/**
 * A todo item, inferred from `todoItemSchema` (decision #8) so the runtime
 * validation at the transport boundary and this static type stay in lockstep.
 * `finishedAt` is stamped by the server when an item is marked done (S1);
 * `null` once un-completed, absent before it has ever been completed.
 */
export type TodoItem = z.infer<typeof todoItemSchema>;

/** Payload accepted when creating a new item. The server stamps `createdAt`. */
export type NewTodoItem = Pick<TodoItem, "label" | "isDone">;
