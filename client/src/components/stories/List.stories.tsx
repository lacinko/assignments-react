import { Meta, StoryObj } from "@storybook/react-vite";
import { action } from "storybook/actions";

import { List } from "../List";
import { ListItem, ListItemProps } from "../ListItem";

const meta = {
    title: "List",
    component: List,
} as Meta<typeof List>;
export default meta;

type Story = StoryObj<typeof List>;

const emptyHandlers: Pick<ListItemProps, "onItemLabelEdit" | "onItemDoneToggle" | "onItemDelete"> = {
    onItemLabelEdit: action("Edit requested"),
    onItemDoneToggle: action("Done state change requested"),
    onItemDelete: action("Removal requested"),
};

export const WithItems: Story = {
    args: {
        children: [
            <ListItem key={1} {...emptyHandlers} label={"Lorem ipsum dolor"} isDone={false} />,
            <ListItem key={2} {...emptyHandlers} label={"Nullam Adipiscing Ridiculus Fusce"} isDone={false} />,
            <ListItem key={3} {...emptyHandlers} label={"Mattis Tristique Parturient "} isDone={true} />,
        ],
    },
};
