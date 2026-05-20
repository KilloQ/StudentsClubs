import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type AdminCollapsibleSectionProps = {
    title: string;
    description?: string;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
};

export default function AdminCollapsibleSection({
    title,
    description,
    expanded,
    onToggle,
    children,
}: AdminCollapsibleSectionProps) {
    return (
        <section className="admin-section">
            <button type="button" className="admin-section-toggle" onClick={onToggle} aria-expanded={expanded}>
                <ChevronDown
                    size={22}
                    className={`admin-section-chevron${expanded ? "" : " admin-section-chevron--collapsed"}`}
                    aria-hidden
                />
                <span className="admin-section-toggle-text">
                    <span className="admin-section-title">{title}</span>
                    {description && <span className="admin-section-desc">{description}</span>}
                </span>
            </button>
            {expanded && <div className="admin-section-body">{children}</div>}
        </section>
    );
}
