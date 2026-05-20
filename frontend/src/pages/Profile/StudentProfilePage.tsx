import { useState, useEffect, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { getStudentProfile } from "../../api/profile";
import type { StudentProfile } from "../../api/profile";
import { getErrorMessage } from "../../utils/errors";
import { useAuth } from "../../contexts/useAuth";
import "./StudentProfilePage.css";

export default function StudentProfilePage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getStudentProfile();
            setProfile(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки профиля"));
        } finally {
            setLoading(false);
        }
    };

    const handleBackClick = () => {
        navigate("/clubs");
    };

    const handleExploreClubsClick = () => {
        navigate("/clubs");
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

    if (error || !profile) {
        return <div className="error-message">{error || "Ошибка загрузки профиля"}</div>;
    }

    return (
        <div className="profile-container">
            <Navbar />
            <div className="profile-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад
                </button>
            </div>

            <div className="profile-content">
                <h1 className="profile-title">Профиль</h1>
                <div className="user-info">
                    <h2 className="user-name">{profile.full_name}</h2>
                    <p className="user-role">Студент</p>
                    <button className="logout-profile-button" onClick={() => setIsLogoutModalOpen(true)}>
                        Выйти из профиля
                    </button>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-number">{profile.stats.my_clubs}</div>
                        <div className="stat-label">Мои кружки</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{profile.stats.total_visits}</div>
                        <div className="stat-label">Посещений</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{profile.stats.attendance_percentage.toFixed(1)}%</div>
                        <div className="stat-label">Посещаемость</div>
                    </div>
                </div>

                {profile.stats.my_clubs > 0 ? (
                    <div className="clubs-schedule-container">
                        <div className="my-clubs-section">
                            <h3 className="section-title">Мои кружки</h3>
                            <div className="club-details">
                                {profile.clubs.map((club) => (
                                    <div key={club.club_id} className="club-item">
                                        <div className="club-header">
                                            <h4 className="club-name">{club.club_title}</h4>
                                            <div className="club-stats">
                                                {club.current_students}/{club.max_students} чел.
                                            </div>
                                        </div>
                                        <p className="club-teacher">
                                            Преподаватель: {club.teacher_name}
                                        </p>
                                        <div className="attendance-info">
                                            <span className="attendance-text">
                                                Посещаемость: {club.visits}/{club.total_classes}
                                            </span>
                                            <span className="attendance-percentage">
                                                {club.attendance_percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill"
                                                style={{ width: `${club.attendance_percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="schedule-section">
                            <h3 className="section-title">Расписание</h3>
                            <div className="schedule-list">
                                {profile.schedule.map((item, index) => (
                                    <div key={index} className="schedule-item">
                                        <div className="schedule-club">{item.club_title}</div>
                                        <div className="schedule-details">
                                            <span className="schedule-day">{item.day_of_week}</span>
                                            <span className="schedule-time">{item.start_time}</span>
                                            <span className="schedule-location">{item.location}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="no-clubs-section">
                        <div className="no-clubs-message">
                            Вы пока не состоите ни в одном кружке
                        </div>
                        <button 
                            className="explore-clubs-button"
                            onClick={handleExploreClubsClick}
                        >
                            Посмотреть доступные кружки
                        </button>
                    </div>
                )}
            </div>
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