import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import styles from "./Header.module.css";

import { Button } from "./Button";
import { Form } from "./form";

type HeaderProps = {
    children: React.ReactNode;
    onItemAdd: (label: string) => void;
};

export const Header = (props: HeaderProps) => {
    const { children, onItemAdd } = props;

    // F3: local view state toggling between the "add" button and the add Form.
    const [isAdding, setIsAdding] = useState(false);

    return (
        <header className={styles.header}>
            <h1 className={styles.title}>{children}</h1>
            {isAdding ? (
                <Form
                    initialValue=""
                    onSubmit={(value) => {
                        onItemAdd(value);
                        setIsAdding(false);
                    }}
                    onCancel={() => setIsAdding(false)}
                />
            ) : (
                <Button variant="primary" aria-label="Add item" onClick={() => setIsAdding(true)}>
                    <PlusIcon />
                </Button>
            )}
        </header>
    );
};
