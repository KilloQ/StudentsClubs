import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateClubModal from "../../modals/CreateClubModal";
import { getTeacherProfile } from "../../api/profile";
import type { TeacherProfile } from "../../api/profile";
import { createClub, getCategories } from "../../api/clubs";
import type { CreateClubRequest } from "../../api/clubs";
import "./TeacherProfilePage.css";

export default function TeacherProfilePage() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        loadProfile();
        loadCategories();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getTeacherProfile();
            setProfile(data);
        } catch (err: any) {
            setError(err.message || "Ошибка загрузки профиля");
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats.filter(c => c !== "Все"));
        } catch (err) {
            console.error("Ошибка загрузки категорий:", err);
        }
    };

    const handleBackClick = () => {
        navigate("/home");
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
        } catch (err: any) {
            setError(err.message || "Ошибка создания кружка");
        }
    };

    const handleManageClubClick = (clubId: number) => {
        navigate(`/manage-club/${clubId}`);
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
            <div className="teacher-profile-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад
                </button>
                <h1 className="teacher-profile-title">Профиль преподавателя</h1>
            </div>

            <div className="teacher-profile-content">
                <div className="teacher-user-info">
                    <div className="user-info-text">
                        <h2 className="teacher-user-name">{profile.full_name}</h2>
                        <p className="teacher-user-role">Преподаватель</p>
                        <h3 className="my-clubs-title">Мои кружки</h3>
                    </div>
                    
                    <button 
                        className="create-club-button"
                        onClick={handleCreateClubClick}
                    >
                        + Создать кружок
                    </button>
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
        </div>
    );
}