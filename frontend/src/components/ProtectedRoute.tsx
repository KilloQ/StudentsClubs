import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireTeacher?: boolean;
}

export default function ProtectedRoute({ children, requireTeacher = false }: ProtectedRouteProps) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireTeacher && !user?.is_teacher) {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
}

