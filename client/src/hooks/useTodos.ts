import { useCallback, useEffect, useMemo, useState } from "react";

import { todosApi } from "../api/todos";
import { TodoItem } from "../types";

/**
 * F7 sort order: "todo" items first, then by creation date descending.
 */
const sortTodos = (items: TodoItem[]): TodoItem[] =>
    [...items].sort(
        (a, b) => Number(a.isDone) - Number(b.isDone) || b.createdAt - a.createdAt,
    );

export const useTodos = () => {
    const [items, setItems] = useState<TodoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // F2: load todo items from the server on mount.
    useEffect(() => {
        let active = true;

        todosApi
            .list()
            .then((loaded) => {
                if (active) setItems(loaded);
            })
            .catch((e: unknown) => {
                if (active) setError(e instanceof Error ? e.message : "Failed to load todo items");
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const upsert = useCallback((item: TodoItem) => {
        setItems((current) => {
            const exists = current.some((i) => i.id === item.id);
            return exists ? current.map((i) => (i.id === item.id ? item : i)) : [...current, item];
        });
    }, []);

    /**
     * Runs a mutation, surfacing any failure (e.g. the server going down
     * mid-session) into `error` instead of leaving it as an unhandled rejection.
     * A successful mutation clears any stale error.
     */
    const runMutation = useCallback(async (action: () => Promise<void>) => {
        try {
            await action();
            setError(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "The action could not be completed");
        }
    }, []);

    // F3: create a new todo item.
    const addItem = useCallback(
        (label: string) =>
            runMutation(async () => {
                const created = await todosApi.create({ label, isDone: false });
                upsert(created);
            }),
        [runMutation, upsert],
    );

    // F4: edit a todo item's label.
    const editLabel = useCallback(
        (id: number, label: string) =>
            runMutation(async () => {
                const updated = await todosApi.updateLabel(id, label);
                upsert(updated);
            }),
        [runMutation, upsert],
    );

    // F5: toggle a todo item between "done" and "todo".
    const toggleDone = useCallback(
        (id: number, isDone: boolean) =>
            runMutation(async () => {
                const updated = await todosApi.setDone(id, isDone);
                upsert(updated);
            }),
        [runMutation, upsert],
    );

    // F6: delete a todo item.
    const deleteItem = useCallback(
        (id: number) =>
            runMutation(async () => {
                await todosApi.remove(id);
                setItems((current) => current.filter((i) => i.id !== id));
            }),
        [runMutation],
    );

    const sortedItems = useMemo(() => sortTodos(items), [items]);

    // F8: counts for the footer.
    const doneCount = useMemo(() => items.filter((i) => i.isDone).length, [items]);
    const todoCount = items.length - doneCount;

    return {
        items: sortedItems,
        isLoading,
        error,
        todoCount,
        doneCount,
        addItem,
        editLabel,
        toggleDone,
        deleteItem,
    };
};
