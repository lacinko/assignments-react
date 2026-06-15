import { NewTodoItem, TodoItem } from "../types";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";
const ITEMS_URL = `${BASE_URL}/items`;

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });

    if (!response.ok) {
        throw new Error(`Request to ${url} failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
};

export const todosApi = {
    list: () => request<TodoItem[]>(ITEMS_URL),

    create: (item: NewTodoItem) =>
        request<TodoItem>(ITEMS_URL, {
            method: "POST",
            body: JSON.stringify(item),
        }),

    updateLabel: (id: number, label: string) =>
        request<TodoItem>(`${ITEMS_URL}/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ label }),
        }),

    setDone: (id: number, isDone: boolean) =>
        isDone
            ? // S1: dedicated endpoint that also stamps `finishedAt`.
              request<TodoItem>(`${ITEMS_URL}/${id}/done`, { method: "PATCH" })
            : request<TodoItem>(`${ITEMS_URL}/${id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ isDone: false, finishedAt: null }),
              }),

    remove: (id: number) =>
        request<unknown>(`${ITEMS_URL}/${id}`, { method: "DELETE" }),
};
