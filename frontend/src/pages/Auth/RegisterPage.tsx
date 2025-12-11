import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Auth.css";

export default function RegisterPage() {
    const [activeTab, setActiveTab] = useState<"login" | "register">("register");
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register, isAuthenticated, loading: authLoading } = useAuth();

    // Если уже авторизован, перенаправляем на главную
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate("/home", { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);

    if (authLoading) {
        return <div>Загрузка...</div>;
    }

    if (isAuthenticated) {
        return null;
    }

    const handleLoginClick = () => {
        navigate("/login");
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== passwordConfirm) {
            setError("Пароли не совпадают");
            return;
        }

        setLoading(true);

        try {
            await register(username, fullName, password, passwordConfirm);
            navigate("/home");
        } catch (err: any) {
            setError(err.message || "Ошибка регистрации");
        } finally {
            setLoading(false);
        }
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

                <form onSubmit={handleRegister}>
                    {error && <div className="auth-error">{error}</div>}
                    <label className="auth-label">Введите логин</label>
                    <input
                        className="auth-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    <label className="auth-label">Введите ФИО</label>
                    <input
                        className="auth-input"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />

                    <label className="auth-label">Придумайте пароль</label>
                    <input
                        className="auth-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <label className="auth-label">Повторите пароль</label>
                    <input
                        className="auth-input"
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required
                    />

                    <button className="auth-button" type="submit" disabled={loading}>
                        {loading ? "Регистрация..." : "Зарегистрироваться"}
                    </button>
                </form>
            </div>
        </div>
    );
}
