import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { getClub, joinClub, leaveClub } from "../../api/clubs";
import type { ClubDetail } from "../../api/clubs";
import { useAuth } from "../../contexts/AuthContext";
import { canJoinOrLeaveClub } from "../../utils/permissions";
import "./ClubPage.css";

export default function ClubPage() {
    const navigate = useNavigate();
    const { clubId } = useParams();
    const { user } = useAuth();
    const [clubData, setClubData] = useState<ClubDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [joining, setJoining] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (clubId) {
            loadClub();
        }
    }, [clubId]);

    const loadClub = async () => {
        try {
            const data = await getClub(Number(clubId));
            setClubData(data);
        } catch (err: any) {
            setError(err.message || "Ошибка загрузки кружка");
        } finally {
            setLoading(false);
        }
    };

    const handleBackClick = () => {
        navigate("/home");
    };

    const handleJoinClick = async () => {
        if (!clubId) return;
        setJoining(true);
        setError("");
        try {
            await joinClub(Number(clubId));
            // Обновляем данные кружка
            await loadClub();
        } catch (err: any) {
            setError(err.message || "Ошибка записи на кружок");
        } finally {
            setJoining(false);
        }
    };

    const handleLeaveClick = async () => {
        if (!clubId) return;
        setLeaving(true);
        setError("");
        try {
            await leaveClub(Number(clubId));
            // Обновляем данные кружка
            await loadClub();
        } catch (err: any) {
            setError(err.message || "Ошибка отписки от кружка");
        } finally {
            setLeaving(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="loading-message">Загрузка...</div>
            </>
        );
    }

    if (error && !clubData) {
        return (
            <>
                <Navbar />
                <div className="error-message">{error}</div>
            </>
        );
    }

    if (!clubData) {
        return null;
    }

    const participants = `${clubData.current_students}/${clubData.max_students}`;
    const recruitmentStatus = clubData.recruitment_open ? "открыт" : "закрыт";

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
                                    <div className="stat-value">{participants}</div>
                                </div>
                            </div>
                            <div className="club-stat">
                                <div className="stat-icon">👨‍🏫</div>
                                <div className="stat-info">
                                    <div className="stat-label">Преподаватель</div>
                                    <div className="stat-value">{clubData.owner_name}</div>
                                </div>
                            </div>
                            <div className="club-stat">
                                <div className="stat-icon">{clubData.recruitment_open ? "✅" : "❌"}</div>
                                <div className="stat-info">
                                    <div className="stat-label">Набор</div>
                                    <div className="stat-value">{recruitmentStatus}</div>
                                </div>
                            </div>
                        </div>

                        <div className="club-section">
                            <h3 className="section-title">О кружке</h3>
                            <p className="club-description">{clubData.description || "Описание отсутствует"}</p>
                        </div>

                        <div className="club-section">
                            <h3 className="section-title">Расписание</h3>
                            <div className="schedule-list">
                                {clubData.schedules && clubData.schedules.length > 0 ? (
                                    clubData.schedules.map((item) => (
                                        <div key={item.id} className="schedule-item">
                                            <span className="schedule-day">{item.day_of_week}</span>
                                            <span className="schedule-time">{item.start_time}</span>
                                            <span className="schedule-location">{item.location}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div>Расписание не установлено</div>
                                )}
                            </div>
                        </div>

                        {canJoinOrLeaveClub(user) && (
                            <>
                                {clubData.is_member ? (
                                    <button 
                                        className="leave-button" 
                                        onClick={handleLeaveClick}
                                        disabled={leaving}
                                    >
                                        {leaving ? "Отписка..." : "Отписаться от кружка"}
                                    </button>
                                ) : clubData.recruitment_open ? (
                                    <button 
                                        className="join-button" 
                                        onClick={handleJoinClick}
                                        disabled={joining}
                                    >
                                        {joining ? "Запись..." : "Записаться"}
                                    </button>
                                ) : (
                                    <div className="recruitment-closed-message">
                                        Набор в кружок закрыт
                                    </div>
                                )}
                            </>
                        )}
                        {error && <div className="error-message">{error}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}