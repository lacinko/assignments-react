import { Pencil1Icon, PlusIcon } from "@radix-ui/react-icons";
import { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../Button";

const meta = {
    title: "Button",
    component: Button,
    argTypes: {
        onClick: { action: "clicked" },
    },
} as Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        variant: "primary",
        children: <PlusIcon />,
    },
};

export const Secondary: Story = {
    args: {
        variant: "secondary",
        children: "Save",
    },
};

export const Icon: Story = {
    args: {
        variant: "icon",
        children: <Pencil1Icon />,
    },
};

export const Disabled: Story = {
    args: {
        variant: "secondary",
        children: "Disabled",
        disabled: true,
    },
};
