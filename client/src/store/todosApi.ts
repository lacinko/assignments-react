import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { todoItemSchema, todoItemsSchema } from "../lib/schemas";
import { NewTodoItem, TodoItem } from "../types";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";

/**
 * RTK Query slice owning all todo server state (F2–F6).
 *
 * This replaces the hand-rolled `api/todos` + manual `useState`/`upsert`
 * bookkeeping with RTK Query's cache: a single `Todos` tag drives automatic
 * refetch/invalidation, and every mutation patches the cache from the object
 * the server returns (decision #4 — the server owns `id`/`createdAt`/`finishedAt`).
 *
 * Every item-returning endpoint parses the response through a zod schema in
 * `transformResponse` (decision #8): a malformed payload throws here and
 * surfaces as the query/mutation's `error` instead of flowing untyped into the
 * cache.
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
        }),

        // F4: edit a todo item's label.
        editLabel: builder.mutation<TodoItem, { id: number; label: string }>({
            query: ({ id, label }) => ({ url: `/items/${id}`, method: "PATCH", body: { label } }),
            transformResponse: (response: unknown) => todoItemSchema.parse(response),
            invalidatesTags: ["Todos"],
        }),

        // F5 / S1: mark done via the dedicated endpoint (so the server stamps
        // `finishedAt`); un-completing uses the generic PATCH and clears it.
        setDone: builder.mutation<TodoItem, { id: number; isDone: boolean }>({
            query: ({ id, isDone }) =>
                isDone
                    ? { url: `/items/${id}/done`, method: "PATCH" }
                    : {
                          url: `/items/${id}`,
                          method: "PATCH",
                          body: { isDone: false, finishedAt: null },
                      },
            transformResponse: (response: unknown) => todoItemSchema.parse(response),
            invalidatesTags: ["Todos"],
        }),

        // F6: delete a todo item.
        deleteItem: builder.mutation<void, number>({
            query: (id) => ({ url: `/items/${id}`, method: "DELETE" }),
            invalidatesTags: ["Todos"],
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
