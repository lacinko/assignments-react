export type TodoItem = {
    id: number;
    label: string;
    isDone: boolean;
    /** Epoch milliseconds, stamped by the server on creation. */
    createdAt: number;
    /** Epoch milliseconds, stamped by the server when the item is marked done (S1). */
    finishedAt?: number;
};

/** Payload accepted when creating a new item. The server stamps `createdAt`. */
export type NewTodoItem = Pick<TodoItem, "label" | "isDone">;
