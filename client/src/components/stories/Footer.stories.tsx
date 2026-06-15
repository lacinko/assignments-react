import { Meta, StoryObj } from "@storybook/react-vite";

import { Footer } from "../Footer";

const meta = {
    title: "Footer",
    component: Footer,
} as Meta<typeof Footer>;
export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
    args: {
        doneItems: 3,
        todoItems: 10,
    },
};

export const EmptyList: Story = {
    args: {},
};
