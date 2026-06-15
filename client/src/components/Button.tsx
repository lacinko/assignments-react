import React from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
};

export const Button = (props: ButtonProps) => {
    const { variant = "secondary", className, type = "button", ...rest } = props;

    const classNames = [styles.button, styles[variant], className].filter(Boolean).join(" ");

    return <button type={type} className={classNames} {...rest} />;
};
