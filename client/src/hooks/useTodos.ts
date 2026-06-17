import { useCallback, useMemo, useRef, useState } from "react";

import {
    useAddItemMutation,
    useDeleteItemMutation,
    useEditLabelMutation,
    useGetItemsQuery,
    useSetDoneMutation,
} from "../store/todosApi";
import { TodoItem } from "../types";

const errorMessage = (e: unknown, fallback: string): string =>
    e instanceof Error ? e.message : fallback;

/**
 * F7 sort order: "todo" items (not done) first, then by creation date
 * descending. Returns a new array; never mutates the input.
 */
const sortTodos = (items: TodoItem[]): TodoItem[] =>
    [...items].sort(
        (a, b) => Number(a.isDone) - Number(b.isDone) || b.createdAt - a.createdAt,
    );

/**
 * Thin integration layer over the RTK Query `todosApi` slice. It keeps the
 * same shape App already consumes (sorted items, counts, mutation callbacks),
 * so the presentational components stay untouched while the data layer, cache,
 * and invalidation are owned by RTK Query.
 */
export const useTodos = () => {
    // F2: load todo items.
    const { data, isLoading, error: loadError, refetch } = useGetItemsQuery();

    const [addItemMutation] = useAddItemMutation();
    const [editLabelMutation] = useEditLabelMutation();
    const [setDoneMutation] = useSetDoneMutation();
    const [deleteItemMutation] = useDeleteItemMutation();

    // Mutation failures (e.g. the server going down mid-session) are surfaced
    // here instead of being swallowed (decision #6); a success clears the
    // stale error. The failed action is retained so the toast can retry it
    // (decision #11) — the optimistic patch was already rolled back, so a retry
    // simply re-applies it.
    const [mutationError, setMutationError] = useState<string | null>(null);
    const lastFailedAction = useRef<(() => Promise<unknown>) | null>(null);

    const runMutation = useCallback(async (action: () => Promise<unknown>) => {
        try {
            await action();
            lastFailedAction.current = null;
            setMutationError(null);
        } catch (e: unknown) {
            lastFailedAction.current = action;
            setMutationError(errorMessage(e, "The action could not be completed"));
        }
    }, []);

    // F3: create a new todo item.
    const addItem = useCallback(
        (label: string) => runMutation(() => addItemMutation({ label, isDone: false }).unwrap()),
        [runMutation, addItemMutation],
    );

    // F4: edit a todo item's label.
    const editLabel = useCallback(
        (id: number, label: string) => runMutation(() => editLabelMutation({ id, label }).unwrap()),
        [runMutation, editLabelMutation],
    );

    // F5: toggle a todo item between "done" and "todo".
    const toggleDone = useCallback(
        (id: number, isDone: boolean) => runMutation(() => setDoneMutation({ id, isDone }).unwrap()),
        [runMutation, setDoneMutation],
    );

    // F6: delete a todo item.
    const deleteItem = useCallback(
        (id: number) => runMutation(() => deleteItemMutation(id).unwrap()),
        [runMutation, deleteItemMutation],
    );

    // Toast actions (decision #11). Dismiss clears the error; retry re-runs the
    // last failed mutation, or refetches when the failure was the initial load.
    const dismissError = useCallback(() => {
        lastFailedAction.current = null;
        setMutationError(null);
    }, []);

    const retry = useCallback(() => {
        if (lastFailedAction.current) {
            void runMutation(lastFailedAction.current);
        } else {
            void refetch();
        }
    }, [runMutation, refetch]);

    const items = useMemo(() => sortTodos(data ?? []), [data]);

    // F8: counts for the footer, derived from the cached list.
    const doneCount = useMemo(() => (data ?? []).filter((i) => i.isDone).length, [data]);
    const todoCount = (data?.length ?? 0) - doneCount;

    const error = mutationError ?? (loadError ? "Failed to load todo items" : null);

    return {
        items,
        isLoading,
        error,
        todoCount,
        doneCount,
        addItem,
        editLabel,
        toggleDone,
        deleteItem,
        retry,
        dismissError,
    };
};
