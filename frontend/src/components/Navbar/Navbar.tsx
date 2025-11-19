import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";

export default function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/login");
    };

    const handleProfileClick = () => {
        navigate("/profile");
    };

    return (
        <div className="navbar">
            <div className="logo">
                <span className="logo-blue">Студ</span>Кружки
            </div>

            <div className="navbar-right">
                <span className="username">Журавлев Алексей Евгеньевич</span>

                <User 
                    className="nav-icon" 
                    size={22} 
                    onClick={handleProfileClick}
                />
                <LogOut 
                    className="nav-icon" 
                    size={22} 
                    onClick={handleLogout}
                />
            </div>
        </div>
    );
}
