import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");
    const navigate = useNavigate();

    const handleRegisterClick = () => {
        navigate("/register");
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Студенческие кружки<br />МТУСИ</h2>
                <p className="auth-subtitle">Войдите или зарегистрируйтесь</p>

                <div className="auth-tabs">
                    <button
                        className={activeTab === "login" ? "tab active" : "tab"}
                        onClick={() => setActiveTab("login")}
                    >
                        Вход
                    </button>

                    <div className="divider" />

                    <button
                        className={activeTab === "register" ? "tab active" : "tab"}
                        onClick={handleRegisterClick}
                    >
                        Регистрация
                    </button>
                </div>

                {activeTab === "login" && (
                    <>
                        <label className="auth-label">Введите логин</label>
                        <input className="auth-input" type="text" />

                        <label className="auth-label">Введите пароль</label>
                        <input className="auth-input" type="password" />

                        <button className="auth-button">
                            Войти
                        </button>
                    </>
                )}

                {activeTab === "register" && (
                    <div className="reg-placeholder">
                        <button onClick={handleRegisterClick}>Перейти на страницу регистрации</button>
                    </div>
                )}
            </div>
        </div>
    );
}
