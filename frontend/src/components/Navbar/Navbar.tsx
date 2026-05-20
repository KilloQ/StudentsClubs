import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { Button, Logo } from "../../shared/components";

export default function Navbar() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleProfileClick = () => {
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
        <div className="navbar">
            <Logo as="button" className="navbar-logo" onClick={() => navigate("/")} />
            <div className="navbar-nav">
                <Button variant="nav" onClick={() => navigate("/")}>
                    Главная
                </Button>
                <Button variant="nav" onClick={() => navigate("/clubs")}>
                    Секции
                </Button>
                <Button variant="nav" onClick={() => navigate("/news")}>
                    Новости
                </Button>
                <Button variant="nav" onClick={handleProfileClick}>
                    Профиль
                </Button>
            </div>
        </div>
    );
}
