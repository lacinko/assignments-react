import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Toast } from "./Toast";

/** Covers the dismissible error toast with retry (decision #11). */
describe("Toast", () => {
    it("shows the message as an alert and fires retry / dismiss", async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();
        const onDismiss = vi.fn();

        render(<Toast message="Something broke" onRetry={onRetry} onDismiss={onDismiss} />);

        expect(screen.getByRole("alert")).toHaveTextContent("Something broke");

        await user.click(screen.getByRole("button", { name: "Retry" }));
        expect(onRetry).toHaveBeenCalledOnce();

        await user.click(screen.getByRole("button", { name: "Dismiss" }));
        expect(onDismiss).toHaveBeenCalledOnce();
    });
});
