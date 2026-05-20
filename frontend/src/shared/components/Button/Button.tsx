import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "nav"
    | "link"
    | "menu"
    | "danger"
    | "footer";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    icon?: ReactNode;
};

export default function Button({
    variant = "primary",
    size = "md",
    fullWidth = false,
    icon,
    className = "",
    children,
    type = "button",
    ...rest
}: ButtonProps) {
    const classes = [
        "ui-btn",
        `ui-btn--${variant}`,
        size !== "md" && `ui-btn--${size}`,
        fullWidth && "ui-btn--full",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button type={type} className={classes} {...rest}>
            {children}
            {icon}
        </button>
    );
}
