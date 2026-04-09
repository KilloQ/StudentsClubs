import { useState, useEffect } from "react";
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
import { AuthContext } from "./AuthContextBase";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Проверяем, есть ли сохраненный токен
        const accessToken = getToken();
        const refreshToken = getRefreshToken();

        if (accessToken || refreshToken) {
            // Пытаемся получить информацию о пользователе
            getCurrentUser()
                .then((userData) => {
                    setUser(userData);
                })
                .catch(() => {
                    // Если токен невалидный, удаляем его
                    removeToken();
                    setUser(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
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

