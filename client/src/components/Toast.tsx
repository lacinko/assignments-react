import { Cross1Icon } from "@radix-ui/react-icons";
import styles from "./Toast.module.css";

import { Button } from "./Button";

type ToastProps = {
    message: string;
    onRetry: () => void;
    onDismiss: () => void;
};

/**
 * Dismissible error banner with a retry action (decision #11). Hand-rolled (no
 * component library, per the README) over the existing `Button`.
 */
export const Toast = (props: ToastProps) => {
    const { message, onRetry, onDismiss } = props;

    return (
        <div className={styles.toast} role="alert">
            <span className={styles.message}>{message}</span>
            <div className={styles.actions}>
                <Button variant="secondary" onClick={onRetry}>
                    Retry
                </Button>
                <Button variant="icon" aria-label="Dismiss" onClick={onDismiss}>
                    <Cross1Icon />
                </Button>
            </div>
        </div>
    );
};
