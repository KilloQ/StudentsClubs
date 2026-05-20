import { useState, useEffect, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import CreateClubModal from "../../modals/CreateClubModal";
import { getTeacherProfile } from "../../api/profile";
import type { TeacherProfile } from "../../api/profile";
import { createClub, getCategories } from "../../api/clubs";
import type { CreateClubRequest } from "../../api/clubs";
import { getErrorMessage } from "../../utils/errors";
import { useAuth } from "../../contexts/useAuth";
import "./TeacherProfilePage.css";

export default function TeacherProfilePage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        loadProfile();
        loadCategories();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getTeacherProfile();
            setProfile(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки профиля"));
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats.filter(c => c !== "Все"));
        } catch (err: unknown) {
            console.error("Ошибка загрузки категорий:", err);
        }
    };

    const handleBackClick = () => {
        navigate("/clubs");
    };

    const handleCreateClubClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleCreateClub = async (clubData: CreateClubRequest) => {
        try {
            await createClub(clubData);
            setIsModalOpen(false);
            await loadProfile(); // Обновляем профиль
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка создания кружка"));
        }
    };

    const handleManageClubClick = (clubId: number) => {
        navigate(`/clubs/${clubId}/manage`);
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            navigate("/login", { replace: true });
        } finally {
            setIsLoggingOut(false);
            setIsLogoutModalOpen(false);
        }
    };

    if (loading) {
        return <div className="loading-message">Загрузка...</div>;
    }

    if (error && !profile) {
        return <div className="error-message">{error}</div>;
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="teacher-profile-container">
            <Navbar />
            <div className="teacher-profile-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад
                </button>
            </div>

            <div className="teacher-profile-content">
                <h1 className="teacher-profile-title">Профиль преподавателя</h1>
                <div className="teacher-user-info">
                    <h2 className="teacher-user-name">{profile.full_name}</h2>
                    <p className="teacher-user-role">Преподаватель</p>
                    <div className="profile-actions">
                        <button type="button" className="profile-action-button" onClick={handleCreateClubClick}>
                            Создать кружок
                        </button>
                        <button
                            type="button"
                            className="profile-action-button"
                            onClick={() => setIsLogoutModalOpen(true)}
                        >
                            Выйти из профиля
                        </button>
                    </div>
                </div>

                <div className="teacher-stats-grid">
                    <div className="teacher-stat-card">
                        <div className="teacher-stat-number">{profile.stats.total_clubs}</div>
                        <div className="teacher-stat-label">Всего кружков</div>
                    </div>
                    <div className="teacher-stat-card">
                        <div className="teacher-stat-number">{profile.stats.active_clubs}</div>
                        <div className="teacher-stat-label">Активных кружков</div>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <h3 className="teacher-section-title">Мои кружки</h3>
                <div className="teacher-clubs-grid">
                    {profile.clubs.map((club) => (
                        <div key={club.id} className="teacher-club-card">
                            <h3 className="teacher-club-title">{club.title}</h3>
                            <p className="teacher-club-students">{club.student_count} студентов</p>
                            <div className={`teacher-club-status ${club.recruitment_open ? 'teacher-status-open' : 'teacher-status-closed'}`}>
                                Набор {club.recruitment_open ? "открыт" : "закрыт"}
                            </div>
                            <button 
                                className="manage-club-button"
                                onClick={() => handleManageClubClick(club.id)}
                            >
                                Управление
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <CreateClubModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onCreate={handleCreateClub}
                categories={categories}
            />
            {isLogoutModalOpen && (
                <div className="logout-modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
                    <div className="logout-modal" onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
                        <h3 className="logout-modal-title">Вы точно хотите выйти?</h3>
                        <div className="logout-modal-actions">
                            <button
                                className="logout-modal-button secondary"
                                onClick={() => setIsLogoutModalOpen(false)}
                                disabled={isLoggingOut}
                            >
                                Отмена
                            </button>
                            <button
                                className="logout-modal-button primary"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? "Выход..." : "Выйти"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}