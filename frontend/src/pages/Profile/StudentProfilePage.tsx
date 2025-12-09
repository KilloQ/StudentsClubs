import { useNavigate } from "react-router-dom";
import "./StudentProfilePage.css";

export default function StudentProfilePage() {
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate("/home");
    };

    const handleExploreClubsClick = () => {
        navigate("/home");
    };

    const userStats = {
        myClubs: 1,
        visits: 2,
        attendance: "33%"
    };

    const studentClubs = [
        {
            id: "1",
            title: "Футбол",
            teacher: "Левин Алексей Евгеньевич",
            totalStudents: 30,
            currentStudents: 2,
            attendanceCount: 1,
            totalClasses: 3,
            attendancePercentage: 33
        }
    ];

    const schedule = [
        { club: "Футбол", day: "Понедельник", time: "17:00", location: "Авиамоторная, Спортзал" },
        { club: "Футбол", day: "Среда", time: "17:00", location: "Авиамоторная, Спортзал" },
        { club: "Футбол", day: "Пятница", time: "16:00", location: "Авиамоторная, Спортзал" }
    ];

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
                    <h2 className="user-name">Журавлев Алексей Евгеньевич</h2>
                    <p className="user-role">Студент</p>
                </div>

                {/* Статистика */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-number">{userStats.myClubs}</div>
                        <div className="stat-label">Мои кружки</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{userStats.visits}</div>
                        <div className="stat-label">Посещений</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{userStats.attendance}</div>
                        <div className="stat-label">Посещаемость</div>
                    </div>
                </div>

                {/* Если есть кружки - показываем блоки Мои кружки и Расписание */}
                {userStats.myClubs > 0 ? (
                    <div className="clubs-schedule-container">
                        {/* Блок Мои кружки */}
                        <div className="my-clubs-section">
                            <h3 className="section-title">Мои кружки</h3>
                            <div className="club-details">
                                {studentClubs.map((club) => (
                                    <div key={club.id} className="club-item">
                                        <div className="club-header">
                                            <h4 className="club-name">{club.title}</h4>
                                            <div className="club-stats">
                                                {club.currentStudents}/{club.totalStudents} чел.
                                            </div>
                                        </div>
                                        <p className="club-teacher">
                                            Преподаватель: {club.teacher}
                                        </p>
                                        <div className="attendance-info">
                                            <span className="attendance-text">
                                                Посещаемость: {club.attendanceCount}/{club.totalClasses}
                                            </span>
                                            <span className="attendance-percentage">
                                                {club.attendancePercentage}%
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill"
                                                style={{ width: `${club.attendancePercentage}%` }}
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
                                {schedule.map((item, index) => (
                                    <div key={index} className="schedule-item">
                                        <div className="schedule-club">{item.club}</div>
                                        <div className="schedule-details">
                                            <span className="schedule-day">{item.day}</span>
                                            <span className="schedule-time">{item.time}</span>
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