import styles from "./Footer.module.css";

type FooterProps = {
    todoItems?: number;
    doneItems?: number;
};

export const Footer = (props: FooterProps) => {
    // F1: default the counters to 0 when no value is passed.
    const { todoItems = 0, doneItems = 0 } = props;

    return (
        <footer className={styles.footer}>
            <span>Todo: {todoItems}</span>
            <span>Done: {doneItems}</span>
        </footer>
    );
};
