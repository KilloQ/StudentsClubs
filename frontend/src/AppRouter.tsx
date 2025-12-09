import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import HomePage from "./pages/Home/HomePage";
import StudentProfilePage from "./pages/Profile/StudentProfilePage";
import TeacherProfilePage from "./pages/Profile/TeacherProfilePage";
import ClubPage from "./pages/Club/ClubPage";
import ClubManagementPage from "./pages/Management/ClubManagementPage";
import "./NotFound.css";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<StudentProfilePage />} />
            <Route path="/teacher-profile" element={<TeacherProfilePage />} />
            <Route path="/club/:clubName" element={<ClubPage />} />
            <Route path="/manage-club/:clubId" element={<ClubManagementPage />} />
            <Route path="*" element={
                <div className="not-found-container">
                    404 — страница не найдена
                </div>
            } />
        </Routes>
    );
}