import type { ButtonHTMLAttributes } from "react";
import "./Logo.css";

export type LogoTone = "default" | "on-dark" | "footer";

type LogoBaseProps = {
    tone?: LogoTone;
    className?: string;
};

type LogoSpanProps = LogoBaseProps & {
    as?: "span";
};

type LogoButtonProps = LogoBaseProps &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
        as: "button";
    };

export type LogoProps = LogoSpanProps | LogoButtonProps;

export default function Logo(props: LogoProps) {
    const { tone = "default", className = "" } = props;
    const classes = ["ui-logo", tone !== "default" && `ui-logo--${tone}`, className].filter(Boolean).join(" ");

    const content = (
        <>
            <span className="ui-logo__accent">Секции</span>Связист
        </>
    );

    if (props.as === "button") {
        const { as: _as, tone: _t, className: _c, ...buttonProps } = props;
        return (
            <button type="button" className={`${classes} ui-logo--button`} {...buttonProps}>
                {content}
            </button>
        );
    }

    return <span className={classes}>{content}</span>;
}
