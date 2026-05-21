import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import AppRouter from "./AppRouter";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <AppRouter />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

