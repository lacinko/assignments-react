import { configureStore } from "@reduxjs/toolkit";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode, act } from "react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TodoItem } from "../types";
import { todosApi } from "../store/todosApi";
import { useTodos } from "./useTodos";

const json = (data: unknown, status = 200): Response =>
    new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
    });

/**
 * Minimal in-memory json-server stand-in so the test exercises the real
 * RTK Query transport (fetchBaseQuery) end-to-end, including cache
 * invalidation/refetch after a mutation.
 */
const makeServer = (initial: TodoItem[]) => {
    const items = [...initial];
    let nextId = Math.max(0, ...items.map((i) => i.id)) + 1;

    // fetchBaseQuery calls fetch() with a Request object, so read method/url/body from it.
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const request = input instanceof Request ? input : new Request(String(input), init);
        const path = new URL(request.url).pathname;
        const method = request.method.toUpperCase();

        if (path === "/items" && method === "GET") {
            return json(items);
        }
        if (path === "/items" && method === "POST") {
            const body = await request.json();
            const created: TodoItem = { id: nextId++, createdAt: Date.now(), ...body };
            items.push(created);
            return json(created);
        }
        return json({ error: "unhandled" }, 404);
    });

    return { fetchMock, getItems: () => items };
};

const wrapper = () => {
    const store = configureStore({
        reducer: { [todosApi.reducerPath]: todosApi.reducer },
        middleware: (gdm) => gdm().concat(todosApi.middleware),
    });
    return ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useTodos", () => {
    it("loads items and exposes them sorted with derived counts (F2/F7/F8)", async () => {
        const { fetchMock } = makeServer([
            { id: 1, label: "old todo", isDone: false, createdAt: 100 },
            { id: 2, label: "done", isDone: true, createdAt: 300 },
            { id: 3, label: "new todo", isDone: false, createdAt: 200 },
        ]);
        vi.stubGlobal("fetch", fetchMock);

        const { result } = renderHook(() => useTodos(), { wrapper: wrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // not-done first (by createdAt desc), then done.
        expect(result.current.items.map((i) => i.id)).toEqual([3, 1, 2]);
        expect(result.current.todoCount).toBe(2);
        expect(result.current.doneCount).toBe(1);
        expect(result.current.error).toBeNull();
    });

    it("surfaces a load failure into error (decision #6)", async () => {
        const fetchMock = vi.fn(() => Promise.resolve(json({ error: "boom" }, 500)));
        vi.stubGlobal("fetch", fetchMock);

        const { result } = renderHook(() => useTodos(), { wrapper: wrapper() });

        await waitFor(() => expect(result.current.error).toBe("Failed to load todo items"));
    });

    it("surfaces a malformed payload from the transport boundary into error (decision #8)", async () => {
        // `isDone` as a string violates todoItemSchema, so transformResponse throws.
        const fetchMock = vi.fn(() =>
            Promise.resolve(json([{ id: 1, label: "bad", isDone: "nope", createdAt: 100 }])),
        );
        vi.stubGlobal("fetch", fetchMock);

        const { result } = renderHook(() => useTodos(), { wrapper: wrapper() });

        await waitFor(() => expect(result.current.error).toBe("Failed to load todo items"));
        expect(result.current.items).toEqual([]);
    });

    it("adds an item via POST and reflects it after refetch (F3)", async () => {
        const { fetchMock, getItems } = makeServer([]);
        vi.stubGlobal("fetch", fetchMock);

        const { result } = renderHook(() => useTodos(), { wrapper: wrapper() });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.addItem("buy milk");
        });

        await waitFor(() => expect(result.current.items).toHaveLength(1));
        expect(result.current.items[0].label).toBe("buy milk");
        expect(getItems()).toHaveLength(1);

        const postCall = fetchMock.mock.calls.find(
            ([input]) => input instanceof Request && input.method === "POST",
        );
        expect(postCall).toBeDefined();
    });
});
