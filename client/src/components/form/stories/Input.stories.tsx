import { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "../Input";

const meta = {
    title: "Form/Input",
    component: Input,
} as Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
    args: {
        value: "",
    },
};

export const WithValue: Story = {
    args: {
        value: "Lorem ipsum",
    },
};
