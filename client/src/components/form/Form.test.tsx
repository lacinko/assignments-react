import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Form } from "./Form";

/**
 * Covers the react-hook-form + zod adoption (decision #8): the public props
 * are unchanged, but `onSubmit` now only fires for a valid, trimmed label.
 */
describe("Form", () => {
    it("blocks an empty/whitespace label and surfaces the validation error", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<Form initialValue="   " onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.click(screen.getByRole("button", { name: "Confirm" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Label cannot be empty");
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits the trimmed label for a valid entry", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<Form initialValue="" onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByRole("textbox"), "  buy milk  ");
        await user.click(screen.getByRole("button", { name: "Confirm" }));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("buy milk");
    });

    it("calls onCancel without validating when reset", async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        const onSubmit = vi.fn();

        render(<Form initialValue="" onSubmit={onSubmit} onCancel={onCancel} />);

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalledOnce();
        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});
