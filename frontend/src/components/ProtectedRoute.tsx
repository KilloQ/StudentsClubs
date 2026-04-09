import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireTeacher?: boolean;
    requireAdmin?: boolean;
    requireStudent?: boolean;
}

export default function ProtectedRoute({ children, requireTeacher = false, requireAdmin = false, requireStudent = false }: ProtectedRouteProps) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && user?.role !== "admin") {
        return <Navigate to="/clubs" replace />;
    }

    if (requireStudent && (user?.is_teacher || user?.role === "admin" || user?.role === "teacher")) {
        return <Navigate to="/clubs" replace />;
    }

    if (requireTeacher && !user?.is_teacher) {
        return <Navigate to="/clubs" replace />;
    }

    return <>{children}</>;
}

