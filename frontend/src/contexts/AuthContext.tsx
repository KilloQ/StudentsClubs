import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { UserResponse } from "../api/auth";
import {
    getCurrentUser,
    getToken,
    getRefreshToken,
    login as apiLogin,
    register as apiRegister,
    logout as apiLogout,
    removeToken,
    saveTokens,
} from "../api/auth";

interface AuthContextType {
    user: UserResponse | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, fullName: string, password: string, passwordConfirm: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("🔐 AuthProvider: Инициализация...");
        // Проверяем, есть ли сохраненный токен
        const accessToken = getToken();
        const refreshToken = getRefreshToken();

        if (accessToken || refreshToken) {
            console.log("🔑 Токен найден, загружаем пользователя...");
            // Пытаемся получить информацию о пользователе
            getCurrentUser()
                .then((userData) => {
                    console.log("✅ Пользователь загружен:", userData);
                    setUser(userData);
                })
                .catch((error) => {
                    // Если токен невалидный, удаляем его
                    console.warn("⚠️ Ошибка загрузки пользователя, удаляем токен:", error);
                    removeToken();
                    setUser(null);
                })
                .finally(() => {
                    setLoading(false);
                    console.log("🏁 AuthProvider: Загрузка завершена");
                });
        } else {
            console.log("🔓 Токен не найден");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const onLogout = () => {
            setUser(null);
            setLoading(false);
        };
        window.addEventListener("auth:logout", onLogout);
        return () => window.removeEventListener("auth:logout", onLogout);
    }, []);

    const login = async (username: string, password: string) => {
        const tokenResponse = await apiLogin({ username, password });
        saveTokens(tokenResponse.access_token, tokenResponse.refresh_token);
        const userData = await getCurrentUser();
        setUser(userData);
    };

    const register = async (username: string, fullName: string, password: string, passwordConfirm: string) => {
        await apiRegister({ username, full_name: fullName, password, password_confirm: passwordConfirm });
        // После регистрации автоматически входим
        await login(username, password);
    };

    const logout = async () => {
        try {
            await apiLogout();
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

