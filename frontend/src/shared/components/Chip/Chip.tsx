import type { ButtonHTMLAttributes } from "react";
import "./Chip.css";

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
};

export default function Chip({ active = false, className = "", type = "button", ...rest }: ChipProps) {
    const classes = ["ui-chip", active && "ui-chip--active", className].filter(Boolean).join(" ");

    return <button type={type} className={classes} {...rest} />;
}
