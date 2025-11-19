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
        myClubs: 0,
        visits: 0,
        attendance: "0%"
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад
                </button>
                <h1 className="profile-title">Профиль</h1>
            </div>

            <div className="profile-content">
                <div className="user-info">
                    <h2 className="user-name">Журавлев Алексей Евгеньевич</h2>
                    <p className="user-role">Студент</p>
                </div>

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

                {userStats.myClubs === 0 && (
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