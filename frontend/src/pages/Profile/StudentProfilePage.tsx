import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentProfile } from "../../api/profile";
import type { StudentProfile } from "../../api/profile";
import "./StudentProfilePage.css";

export default function StudentProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getStudentProfile();
            setProfile(data);
        } catch (err: any) {
            setError(err.message || "Ошибка загрузки профиля");
        } finally {
            setLoading(false);
        }
    };

    const handleBackClick = () => {
        navigate("/home");
    };

    const handleExploreClubsClick = () => {
        navigate("/home");
    };

    if (loading) {
        return <div className="loading-message">Загрузка...</div>;
    }

    if (error || !profile) {
        return <div className="error-message">{error || "Ошибка загрузки профиля"}</div>;
    }

    return (
        <div className="profile-container">
            {/* Верхняя панель */}
            <div className="profile-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад
                </button>
                <h1 className="profile-title">Профиль</h1>
            </div>

            {/* Основной контент */}
            <div className="profile-content">
                {/* Информация о пользователе */}
                <div className="user-info">
                    <h2 className="user-name">{profile.full_name}</h2>
                    <p className="user-role">Студент</p>
                </div>

                {/* Статистика */}
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

                {/* Если есть кружки - показываем блоки Мои кружки и Расписание */}
                {profile.stats.my_clubs > 0 ? (
                    <div className="clubs-schedule-container">
                        {/* Блок Мои кружки */}
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

                        {/* Блок Расписание */}
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
                    /* Если нет кружков - показываем сообщение */
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
        </div>
    );
}