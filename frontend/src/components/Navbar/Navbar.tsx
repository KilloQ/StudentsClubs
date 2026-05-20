import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";

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
            <div className="logo">
                <span className="logo-blue">Секции</span>Связист
            </div>
            <div className="navbar-nav">
                <button className="nav-link-button" onClick={() => navigate("/clubs")}>Секции</button>
                <button className="nav-link-button" onClick={() => navigate("/news")}>Новости</button>
                <button className="nav-link-button" onClick={handleProfileClick}>Профиль</button>
            </div>
        </div>
    );
}
