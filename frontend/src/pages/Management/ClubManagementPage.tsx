import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getClubStudents,
    markAttendance,
    getClubSettings,
    updateClubSettings,
    addScheduleItem,
    deleteScheduleItem,
    getClubStats
} from "../../api/management";
import type {
    StudentAttendanceInfo,
    ClubSettings,
    MarkAttendanceRequest,
    ClubSettingsUpdate,
    ScheduleItemCreate
} from "../../api/management";
import { getErrorMessage } from "../../utils/errors";
import "./ClubManagementPage.css";

export default function ClubManagementPage() {
    const navigate = useNavigate();
    const { clubId } = useParams();
    const [activeTab, setActiveTab] = useState<"students" | "attendance" | "settings">("students");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [students, setStudents] = useState<StudentAttendanceInfo[]>([]);
    
    // Данные для вкладки Посещаемость
    const [attendanceDate, setAttendanceDate] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<number | "">("");
    const [markingAttendance, setMarkingAttendance] = useState(false);

    // Данные для вкладки Настройки
    const [settings, setSettings] = useState<ClubSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        day_of_week: "",
        start_time: "",
        location: ""
    });

    // Статистика
    const [totalStudents, setTotalStudents] = useState(0);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === "students") {
                const studentsData = await getClubStudents(Number(clubId));
                setStudents(studentsData);
            } else if (activeTab === "settings") {
                const settingsData = await getClubSettings(Number(clubId));
                setSettings(settingsData);
            }
            const stats = await getClubStats(Number(clubId));
            setTotalStudents(stats.total_students);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки данных"));
        } finally {
            setLoading(false);
        }
    }, [activeTab, clubId]);

    useEffect(() => {
        if (clubId) {
            loadData();
        }
    }, [clubId, loadData]);

    const handleBackClick = () => {
        navigate("/account/teacher");
    };

    const handleMarkAttendance = async () => {
        if (!attendanceDate || !selectedStudentId) {
            setError("Заполните все поля");
            return;
        }

        setMarkingAttendance(true);
        try {
            const request: MarkAttendanceRequest = {
                student_id: Number(selectedStudentId),
                date: attendanceDate
            };
            await markAttendance(Number(clubId), request);
            setAttendanceDate("");
            setSelectedStudentId("");
            setError("");
            // Обновляем список студентов
            if (activeTab === "students") {
                await loadData();
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка отметки посещения"));
        } finally {
            setMarkingAttendance(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            const update: ClubSettingsUpdate = {
                title: settings.title,
                description: settings.description,
                max_students: settings.max_students,
                recruitment_open: settings.recruitment_open
            };
            await updateClubSettings(Number(clubId), update);
            setError("");
            await loadData();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка сохранения"));
        } finally {
            setSaving(false);
        }
    };

    const handleAddSchedule = async () => {
        if (!newSchedule.day_of_week || !newSchedule.start_time || !newSchedule.location) {
            setError("Заполните все поля расписания");
            return;
        }

        try {
            const scheduleData: ScheduleItemCreate = {
                day_of_week: newSchedule.day_of_week,
                start_time: newSchedule.start_time,
                location: newSchedule.location
            };
            await addScheduleItem(Number(clubId), scheduleData);
            setNewSchedule({ day_of_week: "", start_time: "", location: "" });
            setError("");
            await loadData();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка добавления занятия"));
        }
    };

    const handleDeleteSchedule = async (scheduleId: number) => {
        try {
            await deleteScheduleItem(Number(clubId), scheduleId);
            await loadData();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка удаления занятия"));
        }
    };

    const handleToggleRecruitment = () => {
        if (settings) {
            setSettings({ ...settings, recruitment_open: !settings.recruitment_open });
        }
    };

    const daysOfWeek = [
        "Понедельник",
        "Вторник",
        "Среда",
        "Четверг",
        "Пятница",
        "Суббота",
        "Воскресенье"
    ];

    if (loading && !settings && activeTab === "settings") {
        return <div className="loading-message">Загрузка...</div>;
    }

    return (
        <div className="management-container">
            {/* Верхняя панель */}
            <div className="management-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад к моим кружкам
                </button>
                <h1 className="management-title">{settings?.title || "Панель преподавателя"}</h1>
            </div>

            {/* Основной контент */}
            <div className="management-content">
                {/* Блок Всего студентов */}
                <div className="total-students-card">
                    <div className="total-students-number">{totalStudents}</div>
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

                {error && <div className="error-message">{error}</div>}

                {/* Контент вкладок */}
                <div className="tab-content">
                    {activeTab === "students" && (
                        <div className="students-tab">
                            <h3 className="tab-title">Список студентов ({students.length})</h3>
                            {loading ? (
                                <div className="loading-message">Загрузка...</div>
                            ) : (
                                <div className="students-list">
                                    <div className="list-header">
                                        <div className="header-cell">Студент</div>
                                        <div className="header-cell">Посещений</div>
                                        <div className="header-cell">Процент</div>
                                    </div>
                                    {students.map((student) => (
                                        <div key={student.student_id} className="student-row">
                                            <div className="student-cell name">{student.student_name}</div>
                                            <div className="student-cell visits">
                                                {student.visits}/{student.total_classes}
                                            </div>
                                            <div className="student-cell percentage">
                                                <div className="percentage-value">{student.attendance_percentage.toFixed(1)}%</div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${student.attendance_percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "attendance" && (
                        <div className="attendance-tab">
                            <h3 className="tab-title">Отметить посещаемость</h3>
                            <div className="attendance-form">
                                <div className="form-group">
                                    <label className="form-label">Дата занятия</label>
                                    <input 
                                        type="date" 
                                        className="form-input"
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Студент</label>
                                    <select 
                                        className="form-select"
                                        value={selectedStudentId}
                                        onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : "")}
                                    >
                                        <option value="">Выберите студента</option>
                                        {students.map((student) => (
                                            <option key={student.student_id} value={student.student_id}>
                                                {student.student_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button 
                                    className="mark-attendance-button" 
                                    onClick={handleMarkAttendance}
                                    disabled={markingAttendance}
                                >
                                    {markingAttendance ? "Отметка..." : "Отметить посещение"}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "settings" && settings && (
                        <div className="settings-tab">
                            <h3 className="tab-title">Настройки кружка</h3>
                            <div className="settings-form">
                                <div className="form-group">
                                    <label className="form-label">Название кружка</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={settings.title}
                                        onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Описание</label>
                                    <textarea 
                                        className="form-textarea"
                                        value={settings.description || ""}
                                        onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Максимум студентов</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={settings.max_students}
                                        onChange={(e) => setSettings({ ...settings, max_students: Number(e.target.value) })}
                                        min="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Набор студентов</label>
                                    <div className="toggle-switch" onClick={handleToggleRecruitment}>
                                        <span className="toggle-label">Закрыт</span>
                                        <div className="toggle-slider">
                                            <div className={`toggle-knob ${settings.recruitment_open ? "open" : ""}`}></div>
                                        </div>
                                        <span className="toggle-label">Открыт</span>
                                    </div>
                                </div>

                                {/* Редактор расписания */}
                                <div className="schedule-editor">
                                    <h4 className="editor-title">Расписание</h4>
                                    <div className="schedule-form">
                                        <div className="form-row">
                                            <select 
                                                className="form-input-small"
                                                value={newSchedule.day_of_week}
                                                onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: e.target.value })}
                                            >
                                                <option value="">День</option>
                                                {daysOfWeek.map((day) => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))}
                                            </select>
                                            <input 
                                                type="time" 
                                                className="form-input-small"
                                                value={newSchedule.start_time}
                                                onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                                            />
                                            <input 
                                                type="text" 
                                                className="form-input-medium" 
                                                placeholder="Аудитория"
                                                value={newSchedule.location}
                                                onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                                            />
                                        </div>
                                        <button className="add-schedule-button" onClick={handleAddSchedule}>
                                            Добавить занятие
                                        </button>
                                    </div>

                                    {/* Список занятий */}
                                    <div className="schedule-list">
                                        {settings.schedules.map((item) => (
                                            <div key={item.id} className="schedule-item">
                                                <div className="schedule-info">
                                                    <span className="schedule-day">{item.day_of_week}</span>
                                                    <span className="schedule-time">{item.start_time}</span>
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

                                <button 
                                    className="save-changes-button" 
                                    onClick={handleSaveChanges}
                                    disabled={saving}
                                >
                                    {saving ? "Сохранение..." : "Сохранить изменения"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
