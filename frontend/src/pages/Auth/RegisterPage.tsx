import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function RegisterPage() {
    const [activeTab, setActiveTab] = useState<"login" | "register">("register");
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate("/login");
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Студенческие кружки<br />МТУСИ</h2>
                <p className="auth-subtitle">Войдите или зарегистрируйтесь</p>

                <div className="auth-tabs">
                    <button
                        className={activeTab === "login" ? "tab active" : "tab"}
                        onClick={handleLoginClick}
                    >
                        Вход
                    </button>

                    <div className="divider" />

                    <button
                        className={activeTab === "register" ? "tab active" : "tab"}
                        onClick={() => setActiveTab("register")}
                    >
                        Регистрация
                    </button>
                </div>

                <label className="auth-label">Введите логин</label>
                <input className="auth-input" type="text" />

                <label className="auth-label">Введите ФИО</label>
                <input className="auth-input" type="text" />

                <label className="auth-label">Придумайте пароль</label>
                <input className="auth-input" type="password" />

                <label className="auth-label">Повторите пароль</label>
                <input className="auth-input" type="password" />

                <button className="auth-button">
                    Зарегистрироваться
                </button>
            </div>
        </div>
    );
}
