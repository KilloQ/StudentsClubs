import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ClubManagementPage.css";

export default function ClubManagementPage() {
    const navigate = useNavigate();
    const { clubId } = useParams();
    const [activeTab, setActiveTab] = useState<"students" | "attendance" | "settings">("students");

    const clubData = {
        id: "1",
        title: "Футбол",
        totalStudents: 2,
        maxStudents: 30,
        description: "Присоединяйтесь к нашему футбольному клубу!",
        recruitmentOpen: true,
        schedule: [
            { id: "1", day: "Понедельник", time: "17:00", location: "Авиамоторная, Спортзал" },
            { id: "2", day: "Среда", time: "17:00", location: "Авиамоторная, Спортзал" },
        ]
    };

    const students = [
        { id: "1", name: "Иванов Иван Иванович", visits: 5, totalClasses: 10, percentage: 50 },
        { id: "2", name: "Петров Петр Петрович", visits: 8, totalClasses: 10, percentage: 80 },
    ];

    const handleBackClick = () => {
        navigate("/teacher-profile");
    };

    const handleSaveChanges = () => {
        console.log("Сохранение изменений");
    };

    const handleAddSchedule = () => {
        console.log("Добавление занятия");
    };

    const handleDeleteSchedule = (id: string) => {
        console.log("Удаление занятия:", id);
    };

    const handleMarkAttendance = () => {
        console.log("Отметка посещения");
    };

    return (
        <div className="management-container">
            {/* Верхняя панель */}
            <div className="management-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад к моим кружкам
                </button>
                <h1 className="management-title">{clubData.title}</h1>
            </div>

            {/* Основной контент */}
            <div className="management-content">
                {/* Блок Всего студентов */}
                <div className="total-students-card">
                    <div className="total-students-number">{clubData.totalStudents}</div>
                    <div className="total-students-label">Всего студентов</div>
                </div>

                {/* Панель вкладок */}
                <div className="tabs-container">
                    <button 
                        className={`tab-button ${activeTab === "students" ? "active" : ""}`}
                        onClick={() => setActiveTab("students")}
                    >
                        Студенты
                    </button>
                    <button 
                        className={`tab-button ${activeTab === "attendance" ? "active" : ""}`}
                        onClick={() => setActiveTab("attendance")}
                    >
                        Посещаемость
                    </button>
                    <button 
                        className={`tab-button ${activeTab === "settings" ? "active" : ""}`}
                        onClick={() => setActiveTab("settings")}
                    >
                        Настройки
                    </button>
                </div>

                {/* Контент вкладок */}
                <div className="tab-content">
                    {activeTab === "students" && (
                        <div className="students-tab">
                            <h3 className="tab-title">Список студентов ({students.length})</h3>
                            <div className="students-list">
                                <div className="list-header">
                                    <div className="header-cell">Студент</div>
                                    <div className="header-cell">Посещений</div>
                                    <div className="header-cell">Процент</div>
                                </div>
                                {students.map((student) => (
                                    <div key={student.id} className="student-row">
                                        <div className="student-cell name">{student.name}</div>
                                        <div className="student-cell visits">
                                            {student.visits}/{student.totalClasses}
                                        </div>
                                        <div className="student-cell percentage">
                                            <div className="percentage-value">{student.percentage}%</div>
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill"
                                                    style={{ width: `${student.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "attendance" && (
                        <div className="attendance-tab">
                            <h3 className="tab-title">Отметить посещаемость</h3>
                            <div className="attendance-form">
                                <div className="form-group">
                                    <label className="form-label">Дата занятия</label>
                                    <input type="date" className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Студент</label>
                                    <select className="form-select">
                                        <option value="">Выберите студента</option>
                                        {students.map((student) => (
                                            <option key={student.id} value={student.id}>
                                                {student.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button className="mark-attendance-button" onClick={handleMarkAttendance}>
                                    Отметить посещение
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="settings-tab">
                            <h3 className="tab-title">Настройки кружка</h3>
                            <div className="settings-form">
                                <div className="form-group">
                                    <label className="form-label">Название кружка</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        defaultValue={clubData.title}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Описание</label>
                                    <textarea 
                                        className="form-textarea"
                                        defaultValue={clubData.description}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Максимум студентов</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        defaultValue={clubData.maxStudents}
                                        min="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Набор студентов</label>
                                    <div className="toggle-switch">
                                        <span className="toggle-label">Закрыт</span>
                                        <div className="toggle-slider">
                                            <div className={`toggle-knob ${clubData.recruitmentOpen ? "open" : ""}`}></div>
                                        </div>
                                        <span className="toggle-label">Открыт</span>
                                    </div>
                                </div>

                                {/* Редактор расписания */}
                                <div className="schedule-editor">
                                    <h4 className="editor-title">Расписание</h4>
                                    <div className="schedule-form">
                                        <div className="form-row">
                                            <select className="form-input-small" defaultValue="">
                                                <option value="">День</option>
                                                <option value="monday">Понедельник</option>
                                                <option value="tuesday">Вторник</option>
                                                <option value="wednesday">Среда</option>
                                                <option value="thursday">Четверг</option>
                                                <option value="friday">Пятница</option>
                                            </select>
                                            <input type="time" className="form-input-small" />
                                            <input 
                                                type="text" 
                                                className="form-input-medium" 
                                                placeholder="Аудитория"
                                            />
                                        </div>
                                        <button className="add-schedule-button" onClick={handleAddSchedule}>
                                            Добавить занятие
                                        </button>
                                    </div>

                                    {/* Список занятий */}
                                    <div className="schedule-list">
                                        {clubData.schedule.map((item) => (
                                            <div key={item.id} className="schedule-item">
                                                <div className="schedule-info">
                                                    <span className="schedule-day">{item.day}</span>
                                                    <span className="schedule-time">{item.time}</span>
                                                    <span className="schedule-location">{item.location}</span>
                                                </div>
                                                <button 
                                                    className="delete-schedule-button"
                                                    onClick={() => handleDeleteSchedule(item.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button className="save-changes-button" onClick={handleSaveChanges}>
                                    Сохранить изменения
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}