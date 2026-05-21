import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { getErrorMessage } from "../../utils/errors";
import { Button } from "../../shared/components";
import Navbar from "../../components/Navbar/Navbar";
import "./Auth.css";

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated, loading: authLoading } = useAuth();

    // Если уже авторизован, перенаправляем на главную
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate("/clubs", { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);

    if (authLoading) {
        return <div>Загрузка...</div>;
    }

    if (isAuthenticated) {
        return null;
    }

    const handleRegisterClick = () => {
        navigate("/register");
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(username, password);
            navigate("/clubs");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка входа"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Navbar />
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
                    <form onSubmit={handleLogin}>
                        {error && <div className="auth-error">{error}</div>}
                        <label className="auth-label">Введите логин</label>
                        <input
                            className="auth-input"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />

                        <label className="auth-label">Введите пароль</label>
                        <input
                            className="auth-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <Button variant="primary" type="submit" fullWidth disabled={loading}>
                            {loading ? "Вход..." : "Войти"}
                        </Button>
                    </form>
                )}

                {activeTab === "register" && (
                    <div className="reg-placeholder">
                        <button onClick={handleRegisterClick}>Перейти на страницу регистрации</button>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
