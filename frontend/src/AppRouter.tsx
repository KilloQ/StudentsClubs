import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import HomePage from "./pages/Home/HomePage";
import ClubPage from "./pages/Club/ClubPage";
import NewsPage from "./pages/News/NewsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./NotFound.css";

const StudentProfilePage = lazy(() => import("./pages/Profile/StudentProfilePage"));
const TeacherProfilePage = lazy(() => import("./pages/Profile/TeacherProfilePage"));
const AdminProfilePage = lazy(() => import("./pages/Profile/AdminProfilePage"));
const ClubManagementPage = lazy(() => import("./pages/Management/ClubManagementPage"));

export default function AppRouter() {
    return (
        <Suspense fallback={<div className="loading-message">Загрузка...</div>}>
            <Routes>
                <Route path="/" element={<Navigate to="/clubs" replace />} />

                {/* Публичные*/}
                <Route path="/clubs" element={<HomePage />} />
                <Route path="/clubs/:clubId" element={<ClubPage />} />
                <Route path="/news" element={<NewsPage />} />

                {/* Служебные*/}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/account/profile" element={<ProtectedRoute requireStudent><StudentProfilePage /></ProtectedRoute>} />
                <Route path="/account/teacher" element={<ProtectedRoute requireTeacher><TeacherProfilePage /></ProtectedRoute>} />
                <Route path="/account/admin" element={<ProtectedRoute requireAdmin><AdminProfilePage /></ProtectedRoute>} />
                <Route path="/clubs/:clubId/manage" element={<ProtectedRoute requireTeacher><ClubManagementPage /></ProtectedRoute>} />

                <Route path="*" element={
                    <div className="not-found-container">
                        404 — страница не найдена
                    </div>
                } />
            </Routes>
        </Suspense>
    );
}