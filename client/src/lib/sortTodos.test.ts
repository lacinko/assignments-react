import { describe, expect, it } from "vitest";

import { TodoItem } from "../types";
import { sortTodos } from "./sortTodos";

const item = (over: Partial<TodoItem> & Pick<TodoItem, "id">): TodoItem => ({
    label: `item ${over.id}`,
    isDone: false,
    createdAt: over.id,
    ...over,
});

describe("sortTodos (F7)", () => {
    it("puts not-done items before done items", () => {
        const result = sortTodos([
            item({ id: 1, isDone: true }),
            item({ id: 2, isDone: false }),
        ]);

        expect(result.map((i) => i.id)).toEqual([2, 1]);
    });

    it("orders by createdAt descending within the same done state", () => {
        const result = sortTodos([
            item({ id: 1, createdAt: 100 }),
            item({ id: 2, createdAt: 300 }),
            item({ id: 3, createdAt: 200 }),
        ]);

        expect(result.map((i) => i.id)).toEqual([2, 3, 1]);
    });

    it("applies the done split first, then the date order", () => {
        const result = sortTodos([
            item({ id: 1, isDone: true, createdAt: 500 }),
            item({ id: 2, isDone: false, createdAt: 100 }),
            item({ id: 3, isDone: true, createdAt: 900 }),
            item({ id: 4, isDone: false, createdAt: 400 }),
        ]);

        // not-done (4 then 2) before done (3 then 1), each by createdAt desc.
        expect(result.map((i) => i.id)).toEqual([4, 2, 3, 1]);
    });

    it("does not mutate the input array", () => {
        const input = [item({ id: 1 }), item({ id: 2 })];
        const snapshot = [...input];

        sortTodos(input);

        expect(input).toEqual(snapshot);
    });
});
