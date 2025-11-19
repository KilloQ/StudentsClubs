import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./ClubPage.css";

export default function ClubPage() {
    const navigate = useNavigate();
    const { clubName } = useParams();

    const handleBackClick = () => {
        navigate("/home");
    };

    const handleJoinClick = () => {
        console.log("Запись на кружок:", clubName);
    };

    const clubData = {
        title: "Футбол",
        category: "Спортивные",
        participants: "2/30",
        teacher: "Левин Алексей Евгеньевич",
        recruitment: "открыт",
        description: "Присоединяйтесь к нашему футбольному клубу! Мы проводим тренировки 3 раза в неделю, участвуем в межвузовских турнирах.",
        schedule: [
            { day: "Понедельник", time: "17:00", location: "Авиамоторная, Спортзал" },
            { day: "Среда", time: "17:00", location: "Авиамоторная, Спортзал" },
            { day: "Пятница", time: "16:00", location: "Авиамоторная, Спортзал" }
        ]
    };

    return (
        <div className="club-page-container">
            <Navbar />

            <div className="club-page-back">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад
                </button>
            </div>

            <div className="club-page-content">
                <div className="club-main-card">
                    <div className="club-header-gradient">
                        <div className="club-header-info">
                            <h1 className="club-title">{clubData.title}</h1>
                            <span className="club-category">{clubData.category}</span>
                        </div>
                    </div>

                    <div className="club-main-content">
                        <div className="club-stats-row">
                            <div className="club-stat">
                                <div className="stat-icon">👥</div>
                                <div className="stat-info">
                                    <div className="stat-label">Участников</div>
                                    <div className="stat-value">{clubData.participants}</div>
                                </div>
                            </div>
                            <div className="club-stat">
                                <div className="stat-icon">👨‍🏫</div>
                                <div className="stat-info">
                                    <div className="stat-label">Преподаватель</div>
                                    <div className="stat-value">{clubData.teacher}</div>
                                </div>
                            </div>
                            <div className="club-stat">
                                <div className="stat-icon">{clubData.recruitment === "открыт" ? "✅" : "❌"}</div>
                                <div className="stat-info">
                                    <div className="stat-label">Набор</div>
                                    <div className="stat-value">{clubData.recruitment}</div>
                                </div>
                            </div>
                        </div>

                        <div className="club-section">
                            <h3 className="section-title">О кружке</h3>
                            <p className="club-description">{clubData.description}</p>
                        </div>

                        <div className="club-section">
                            <h3 className="section-title">Расписание</h3>
                            <div className="schedule-list">
                                {clubData.schedule.map((item, index) => (
                                    <div key={index} className="schedule-item">
                                        <span className="schedule-day">{item.day}</span>
                                        <span className="schedule-time">{item.time}</span>
                                        <span className="schedule-location">{item.location}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="join-button" onClick={handleJoinClick}>
                            Записаться
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}