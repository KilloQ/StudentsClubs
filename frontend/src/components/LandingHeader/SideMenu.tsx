import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import { Button, Logo } from "../../shared/components";
import "./SideMenu.css";

const CLUB_VK_URL = "https://vk.com/mssksvyazist";

type SideMenuProps = {
    open: boolean;
    onClose: () => void;
};

export default function SideMenu({ open, onClose }: SideMenuProps) {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    const goTo = (path: string) => {
        onClose();
        navigate(path);
    };

    const scrollToSection = (id: string) => {
        onClose();
        requestAnimationFrame(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const handleProfile = () => {
        onClose();
        if (!user) {
            navigate("/login");
        } else if (user.role === "admin") {
            navigate("/account/admin");
        } else if (user.is_teacher) {
            navigate("/account/teacher");
        } else {
            navigate("/account/profile");
        }
    };

    return (
        <div className={`side-menu-root ${open ? "side-menu-root-open" : ""}`} aria-hidden={!open}>
            <button type="button" className="side-menu-overlay" aria-label="Закрыть меню" onClick={onClose} tabIndex={open ? 0 : -1} />
            <aside
                className="side-menu-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Навигация"
                id="landing-side-menu"
            >
                <div className="side-menu-head">
                    <Logo className="side-menu-brand" />
                    <button type="button" className="side-menu-close" aria-label="Закрыть" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <nav className="side-menu-nav">
                    <Button variant="menu" onClick={() => scrollToSection("hero-title")}>
                        Главная
                    </Button>
                    <Button variant="menu" onClick={() => goTo("/clubs")}>
                        Секции
                    </Button>
                    <Button variant="menu" onClick={() => goTo("/news")}>
                        Новости
                    </Button>
                    <Button variant="menu" onClick={() => scrollToSection("about-club")}>
                        О клубе
                    </Button>
                    <Button variant="menu" onClick={() => scrollToSection("contact")}>
                        Контакты
                    </Button>
                    <Button variant="menu" onClick={handleProfile}>
                        Профиль
                    </Button>
                    {!user && (
                        <>
                            <Button variant="menu" onClick={() => goTo("/login")}>
                                Вход
                            </Button>
                            <Button variant="menu" onClick={() => goTo("/register")}>
                                Регистрация
                            </Button>
                        </>
                    )}
                </nav>
                <div className="side-menu-footer">
                    <a href={CLUB_VK_URL} target="_blank" rel="noopener noreferrer" className="side-menu-vk">
                        ВКонтакте
                    </a>
                </div>
            </aside>
        </div>
    );
}
