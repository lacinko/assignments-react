import { CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import styles from "./Form.module.css";

import { Button } from "../Button";
import { Input } from "./Input";

type FormProps = {
    initialValue: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
};

export const Form = (props: FormProps) => {
    const { initialValue, onSubmit, onCancel } = props;

    const [inputValue, setInputValue] = useState(initialValue);

    return (
        <form
            className={styles.form}
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(inputValue);
            }}
            onReset={() => {
                onCancel();
            }}
        >
            <Input value={inputValue} onValueChange={(value) => setInputValue(value)} />
            <Button variant="icon" type="submit" aria-label="Confirm">
                <CheckIcon />
            </Button>
            <Button variant="icon" type="reset" aria-label="Cancel">
                <Cross1Icon />
            </Button>
        </form>
    );
};
