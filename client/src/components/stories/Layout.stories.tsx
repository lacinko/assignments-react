import { Meta, StoryObj } from "@storybook/react";
import { action } from "storybook/actions";

import { Footer } from "../Footer";
import { Header } from "../Header";
import { List } from "../List";
import { ListItem } from "../ListItem";
import { Layout } from "../Layout";

const meta = {
    title: "Layout",
    component: Layout,
} as Meta<typeof Layout>;
export default meta;
type Story = StoryObj<typeof Layout>;

const itemHandlers = {
    onItemLabelEdit: action("Edit requested"),
    onItemDoneToggle: action("Done state change requested"),
    onItemDelete: action("Removal requested"),
};

export const WithContent: Story = {
    args: {
        children: [
            <Header key="header" onItemAdd={action("Item added")}>
                To Do app
            </Header>,
            <List key="list">
                <ListItem {...itemHandlers} label="Buy milk" isDone={false} />
                <ListItem {...itemHandlers} label="Walk the dog" isDone={true} />
            </List>,
            <Footer key="footer" todoItems={1} doneItems={1} />,
        ],
    },
};

// Demonstrates B2: with little content the Footer is still pinned to the bottom.
export const SparseContent: Story = {
    args: {
        children: [
            <Header key="header" onItemAdd={action("Item added")}>
                To Do app
            </Header>,
            <List key="list">
                <ListItem {...itemHandlers} label="Only one item" isDone={false} />
            </List>,
            <Footer key="footer" todoItems={1} doneItems={0} />,
        ],
    },
};
