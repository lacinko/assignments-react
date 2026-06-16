import { useCallback, useMemo, useState } from "react";

import { sortTodos } from "../lib/sortTodos";
import {
    useAddItemMutation,
    useDeleteItemMutation,
    useEditLabelMutation,
    useGetItemsQuery,
    useSetDoneMutation,
} from "../store/todosApi";

const errorMessage = (e: unknown, fallback: string): string =>
    e instanceof Error ? e.message : fallback;

/**
 * Thin integration layer over the RTK Query `todosApi` slice. It keeps the
 * same shape App already consumes (sorted items, counts, mutation callbacks),
 * so the presentational components stay untouched while the data layer, cache,
 * and invalidation are owned by RTK Query.
 */
export const useTodos = () => {
    // F2: load todo items.
    const { data, isLoading, error: loadError } = useGetItemsQuery();

    const [addItemMutation] = useAddItemMutation();
    const [editLabelMutation] = useEditLabelMutation();
    const [setDoneMutation] = useSetDoneMutation();
    const [deleteItemMutation] = useDeleteItemMutation();

    // Mutation failures (e.g. the server going down mid-session) are surfaced
    // here instead of being swallowed (decision #6); a success clears the
    // stale error.
    const [mutationError, setMutationError] = useState<string | null>(null);

    const runMutation = useCallback(async (action: () => Promise<unknown>) => {
        try {
            await action();
            setMutationError(null);
        } catch (e: unknown) {
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
    };
};
