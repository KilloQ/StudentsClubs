import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Logo } from "../../shared/components";
import SideMenu from "./SideMenu";
import "./LandingHeader.css";

export default function LandingHeader() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <header className="landing-header">
                <Logo as="button" tone="on-dark" className="landing-header-logo" onClick={() => navigate("/")} />
                <div className="landing-header-actions">
                    <button
                        type="button"
                        className="landing-header-menu-btn"
                        aria-label="Открыть меню"
                        aria-expanded={menuOpen}
                        aria-controls="landing-side-menu"
                        onClick={() => setMenuOpen(true)}
                    >
                        <Menu size={28} strokeWidth={2} aria-hidden />
                    </button>
                </div>
            </header>
            <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
    );
}
