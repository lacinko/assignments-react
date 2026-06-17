import { CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import styles from "./Form.module.css";

import { Button } from "../Button";
import { Input } from "./Input";
import { LabelForm, labelSchema } from "../../lib/schemas";

type FormProps = {
    initialValue: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
};

/**
 * Add/edit form. Form state and label validation are owned by react-hook-form
 * + the zod `labelSchema` (decision #8); `Controller` bridges the existing
 * controlled `Input` so its props stay untouched. `onSubmit` only fires for a
 * valid (non-empty, trimmed) label — the public props are unchanged.
 */
export const Form = (props: FormProps) => {
    const { initialValue, onSubmit, onCancel } = props;

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LabelForm>({
        resolver: zodResolver(labelSchema),
        defaultValues: { label: initialValue },
    });

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit((data) => onSubmit(data.label))}
            onReset={() => onCancel()}
        >
            <Controller
                control={control}
                name="label"
                render={({ field }) => <Input value={field.value} onValueChange={field.onChange} />}
            />
            <Button variant="icon" type="submit" aria-label="Confirm">
                <CheckIcon />
            </Button>
            <Button variant="icon" type="reset" aria-label="Cancel">
                <Cross1Icon />
            </Button>
            {errors.label && (
                <span role="alert" className={styles.error}>
                    {errors.label.message}
                </span>
            )}
        </form>
    );
};
