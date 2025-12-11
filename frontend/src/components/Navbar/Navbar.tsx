import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleProfileClick = () => {
        if (user?.is_teacher) {
            navigate("/teacher-profile");
        } else {
            navigate("/profile");
        }
    };

    return (
        <div className="navbar">
            <div className="logo">
                <span className="logo-blue">Студ</span>Кружки
            </div>

            <div className="navbar-right">
                {user && <span className="username">{user.full_name}</span>}

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
