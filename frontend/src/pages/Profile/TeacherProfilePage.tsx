import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateClubModal from "../../modals/CreateClubModal";
import "./TeacherProfilePage.css";

export default function TeacherProfilePage() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleBackClick = () => {
        navigate("/home");
    };

    const handleCreateClubClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleCreateClub = (clubData: any) => {
        console.log("Создан кружок:", clubData);
    };

    const handleManageClubClick = (clubId: string) => {
        console.log("Переход к управлению кружком:", clubId);
    };

    const teacherStats = {
        totalClubs: 2,
        activeClubs: 1
    };

    const teacherClubs = [
        {
            id: "1",
            title: "Футбол",
            studentCount: 2,
            recruitmentOpen: true
        },
        {
            id: "2", 
            title: "Мини футбол",
            studentCount: 0,
            recruitmentOpen: false
        }
    ];

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
                        <h2 className="teacher-user-name">Иванов Сергей Петрович</h2>
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
                        <div className="teacher-stat-number">{teacherStats.totalClubs}</div>
                        <div className="teacher-stat-label">Всего кружков</div>
                    </div>
                    <div className="teacher-stat-card">
                        <div className="teacher-stat-number">{teacherStats.activeClubs}</div>
                        <div className="teacher-stat-label">Активных кружков</div>
                    </div>
                </div>

                <div className="teacher-clubs-grid">
                    {teacherClubs.map((club) => (
                        <div key={club.id} className="teacher-club-card">
                            <h3 className="teacher-club-title">{club.title}</h3>
                            <p className="teacher-club-students">{club.studentCount} студентов</p>
                            <div className={`teacher-club-status ${club.recruitmentOpen ? 'teacher-status-open' : 'teacher-status-closed'}`}>
                                Набор {club.recruitmentOpen ? "открыт" : "закрыт"}
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
            />
        </div>
    );
}