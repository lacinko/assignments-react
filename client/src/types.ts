export type TodoItem = {
    id: number;
    label: string;
    isDone: boolean;
    /** Epoch milliseconds, stamped by the server on creation. */
    createdAt: number;
    /**
     * Epoch milliseconds, stamped by the server when the item is marked done (S1).
     * `null` once the item is un-completed (the server clears it); absent before
     * it has ever been completed.
     */
    finishedAt?: number | null;
};

/** Payload accepted when creating a new item. The server stamps `createdAt`. */
export type NewTodoItem = Pick<TodoItem, "label" | "isDone">;
