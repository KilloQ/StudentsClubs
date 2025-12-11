import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import TestPage from "./pages/TestPage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import HomePage from "./pages/Home/HomePage";
import StudentProfilePage from "./pages/Profile/StudentProfilePage";
import TeacherProfilePage from "./pages/Profile/TeacherProfilePage";
import ClubPage from "./pages/Club/ClubPage";
import ClubManagementPage from "./pages/Management/ClubManagementPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./NotFound.css";

export default function AppRouter() {
    const location = useLocation();
    console.log("🛣️ AppRouter: Текущий путь:", location.pathname);
    
    return (
        <Routes>
            <Route path="/test" element={<TestPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
            <Route path="/teacher-profile" element={<ProtectedRoute requireTeacher><TeacherProfilePage /></ProtectedRoute>} />
            <Route path="/club/:clubId" element={<ProtectedRoute><ClubPage /></ProtectedRoute>} />
            <Route path="/manage-club/:clubId" element={<ProtectedRoute requireTeacher><ClubManagementPage /></ProtectedRoute>} />
            <Route path="*" element={
                <div className="not-found-container">
                    404 — страница не найдена
                </div>
            } />
        </Routes>
    );
}