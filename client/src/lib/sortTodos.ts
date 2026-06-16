import { TodoItem } from "../types";

/**
 * F7 sort order: "todo" items (not done) first, then by creation date
 * descending. Pure and side-effect free so it can be unit-tested directly.
 */
export const sortTodos = (items: TodoItem[]): TodoItem[] =>
    [...items].sort(
        (a, b) => Number(a.isDone) - Number(b.isDone) || b.createdAt - a.createdAt,
    );
