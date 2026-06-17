import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { todoItemSchema, todoItemsSchema } from "../lib/schemas";
import { NewTodoItem, TodoItem } from "../types";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";

/**
 * Wait for an optimistic mutation to settle; if it rejects, undo the cache
 * patch so a failed mutation never leaves the cache dirty (decision #11).
 */
const rollbackOnError = async (queryFulfilled: Promise<unknown>, patch: { undo: () => void }) => {
    try {
        await queryFulfilled;
    } catch {
        patch.undo();
    }
};

/**
 * RTK Query slice owning all todo server state (F2–F6).
 *
 * This replaces the hand-rolled `api/todos` + manual `useState`/`upsert`
 * bookkeeping with RTK Query's cache: a single `Todos` tag drives automatic
 * refetch/invalidation, and every mutation patches the cache from the object
 * the server returns (decision #4 — the server owns `id`/`createdAt`/`finishedAt`).
 *
 * Every item-returning endpoint parses the response through a zod schema in
 * `transformResponse` (decision #10): a malformed payload throws here and
 * surfaces as the query/mutation's `error` instead of flowing untyped into the
 * cache.
 *
 * Each mutation also applies an **optimistic** patch to the cached `getItems`
 * list in `onQueryStarted` (decision #11), so the UI reacts instantly; on
 * failure the patch is rolled back (`undo()`) and `invalidatesTags` does not
 * fire, so a rejected mutation never leaves the cache dirty. On success the tag
 * invalidation refetches the authoritative list (correcting server-owned fields
 * like the exact `finishedAt`).
 */
export const todosApi = createApi({
    reducerPath: "todosApi",
    baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
    tagTypes: ["Todos"],
    endpoints: (builder) => ({
        // F2: load todo items.
        getItems: builder.query<TodoItem[], void>({
            query: () => "/items",
            transformResponse: (response: unknown) => todoItemsSchema.parse(response),
            providesTags: ["Todos"],
        }),

        // F3: create a new todo item (server stamps `createdAt`).
        addItem: builder.mutation<TodoItem, NewTodoItem>({
            query: (body) => ({ url: "/items", method: "POST", body }),
            transformResponse: (response: unknown) => todoItemSchema.parse(response),
            invalidatesTags: ["Todos"],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                // Optimistically show the new item with a placeholder id; the
                // refetch on success swaps in the server's real id/createdAt.
                const patch = dispatch(
                    todosApi.util.updateQueryData("getItems", undefined, (draft) => {
                        draft.push({ id: -Date.now(), createdAt: Date.now(), ...arg });
                    }),
                );
                await rollbackOnError(queryFulfilled, patch);
            },
        }),

        // F4: edit a todo item's label.
        editLabel: builder.mutation<TodoItem, { id: number; label: string }>({
            query: ({ id, label }) => ({ url: `/items/${id}`, method: "PATCH", body: { label } }),
            transformResponse: (response: unknown) => todoItemSchema.parse(response),
            invalidatesTags: ["Todos"],
            async onQueryStarted({ id, label }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    todosApi.util.updateQueryData("getItems", undefined, (draft) => {
                        const item = draft.find((i) => i.id === id);
                        if (item) item.label = label;
                    }),
                );
                await rollbackOnError(queryFulfilled, patch);
            },
        }),

        // F5 / S1: toggle done-ness through the single dedicated endpoint for
        // both directions; the server owns `finishedAt` (stamps it on done,
        // clears it on un-complete) so the client never sets the timestamp.
        setDone: builder.mutation<TodoItem, { id: number; isDone: boolean }>({
            query: ({ id, isDone }) => ({
                url: `/items/${id}/done`,
                method: "PATCH",
                body: { isDone },
            }),
            transformResponse: (response: unknown) => todoItemSchema.parse(response),
            invalidatesTags: ["Todos"],
            async onQueryStarted({ id, isDone }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    todosApi.util.updateQueryData("getItems", undefined, (draft) => {
                        const item = draft.find((i) => i.id === id);
                        if (item) {
                            item.isDone = isDone;
                            // Provisional; the refetch corrects to the server's stamp.
                            item.finishedAt = isDone ? Date.now() : null;
                        }
                    }),
                );
                await rollbackOnError(queryFulfilled, patch);
            },
        }),

        // F6: delete a todo item.
        deleteItem: builder.mutation<void, number>({
            query: (id) => ({ url: `/items/${id}`, method: "DELETE" }),
            invalidatesTags: ["Todos"],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    todosApi.util.updateQueryData("getItems", undefined, (draft) => {
                        const index = draft.findIndex((i) => i.id === id);
                        if (index !== -1) draft.splice(index, 1);
                    }),
                );
                await rollbackOnError(queryFulfilled, patch);
            },
        }),
    }),
});

export const {
    useGetItemsQuery,
    useAddItemMutation,
    useEditLabelMutation,
    useSetDoneMutation,
    useDeleteItemMutation,
} = todosApi;
