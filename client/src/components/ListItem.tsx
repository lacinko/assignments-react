import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import styles from "./ListItem.module.css";

import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Form } from "./form";

export type ListItemProps = {
    label: string;
    isDone: boolean;
    onItemLabelEdit: (label: string) => void;
    onItemDoneToggle: (isDone: boolean) => void;
    onItemDelete: () => void;
};

export const ListItem = (props: ListItemProps) => {
    const { label, isDone, onItemLabelEdit, onItemDoneToggle, onItemDelete } = props;

    // F4: local view state toggling the row between its label/actions and the edit Form.
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className={styles.item}>
                <Form
                    initialValue={label}
                    onSubmit={(value) => {
                        onItemLabelEdit(value);
                        setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className={styles.item}>
            {/* F5: Radix passes a CheckedState; coerce to a strict boolean. */}
            <Checkbox checked={isDone} onCheckedChange={(checked) => onItemDoneToggle(checked === true)} />
            <label className={styles.label}>{label}</label>
            <div className={styles.actions}>
                <Button variant="icon" aria-label="Edit item" onClick={() => setIsEditing(true)}>
                    <Pencil1Icon />
                </Button>
                <Button variant="icon" aria-label="Delete item" onClick={() => onItemDelete()}>
                    <TrashIcon />
                </Button>
            </div>
        </div>
    );
};
