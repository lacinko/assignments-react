import { Meta, StoryObj } from "@storybook/react";

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
