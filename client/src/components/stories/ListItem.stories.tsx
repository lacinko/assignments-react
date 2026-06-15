import { Meta, StoryObj } from "@storybook/react-vite";

import { ListItem } from "../ListItem";

const meta = {
    title: "List Item",
    component: ListItem,
    argTypes: {
        onItemDelete: { action: "removed" },
        onItemLabelEdit: { action: "edited" },
        onItemDoneToggle: { action: "toggled" },
    },
} as Meta<typeof ListItem>;
export default meta;
type Story = StoryObj<typeof ListItem>;
export const ToDo: Story = {
    args: {
        label: "Lorem ipsum dolor",
        isDone: false,
    },
};
export const Done: Story = {
    args: {
        ...ToDo.args,
        isDone: true,
    },
};

// SB3: showcases UI3 — the edit/delete actions are hidden until the row is
// hovered (or focused). Hover over the item below to reveal them.
export const ActionsOnHover: Story = {
    args: {
        ...ToDo.args,
        label: "Hover over me to reveal the actions",
    },
    parameters: {
        docs: {
            description: {
                story: "Action buttons appear only when hovering over (or focusing within) the ListItem.",
            },
        },
    },
};
