import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import {
    getClubStudents,
    getAttendanceByDate,
    markAttendanceBulk,
    getClubSettings,
    updateClubSettings,
    addScheduleItem,
    deleteScheduleItem,
    getClubStats,
    updateClubImage
} from "../../api/management";
import type {
    StudentAttendanceInfo,
    ClubSettings,
    ClubSettingsUpdate,
    ScheduleItemCreate
} from "../../api/management";
import { createAnnouncement, deleteAnnouncement, getAnnouncements, type Announcement } from "../../api/announcements";
import { FileInput } from "../../shared/components";
import { getErrorMessage } from "../../utils/errors";
import { useToast } from "../../contexts/useToast";
import {
    formatScheduleSlot,
    isDateOnScheduleWeekday,
    isScheduleDayToday,
    snapDateToScheduleWeekday,
    suggestedDateForScheduleDay,
    type ScheduleSlot,
} from "../../utils/schedule";
import "./ClubManagementPage.css";

function todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function ClubManagementPage() {
    const navigate = useNavigate();
    const { clubId } = useParams();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<"students" | "attendance" | "settings" | "announcements">("students");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [students, setStudents] = useState<StudentAttendanceInfo[]>([]);
    
    const [attendanceDate, setAttendanceDate] = useState(todayIsoDate);
    const [attendanceScheduleId, setAttendanceScheduleId] = useState<number | null>(null);
    const attendanceScheduleInitialized = useRef(false);
    const [presentStudentIds, setPresentStudentIds] = useState<Set<number>>(new Set());
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [markingAttendance, setMarkingAttendance] = useState(false);

    // Данные для вкладки Настройки
    const [settings, setSettings] = useState<ClubSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        day_of_week: "",
        start_time: "",
        location: ""
    });
    const [imageUploading, setImageUploading] = useState(false);
    const [announcementForm, setAnnouncementForm] = useState({ title: "", description: "", image: null as File | null });
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementSaving, setAnnouncementSaving] = useState(false);

    // Статистика
    const [totalStudents, setTotalStudents] = useState(0);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === "students" || activeTab === "attendance") {
                const studentsData = await getClubStudents(Number(clubId));
                setStudents(studentsData);
                if (activeTab === "attendance") {
                    const settingsData = await getClubSettings(Number(clubId));
                    setSettings(settingsData);
                    if (
                        settingsData.schedules.length > 0 &&
                        !attendanceScheduleInitialized.current
                    ) {
                        const first = settingsData.schedules[0];
                        setAttendanceScheduleId(first.id);
                        setAttendanceDate(suggestedDateForScheduleDay(first.day_of_week));
                        attendanceScheduleInitialized.current = true;
                    }
                }
            } else if (activeTab === "settings") {
                const settingsData = await getClubSettings(Number(clubId));
                setSettings(settingsData);
            } else if (activeTab === "announcements") {
                const announcementsData = await getAnnouncements({ club_id: Number(clubId), page: 1, page_size: 20 });
                setAnnouncements(announcementsData.items);
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

    const scheduleSlots: ScheduleSlot[] = settings?.schedules ?? [];
    const selectedScheduleSlot =
        attendanceScheduleId != null
            ? scheduleSlots.find((s) => s.id === attendanceScheduleId) ?? null
            : null;

    const loadAttendanceForDate = useCallback(async () => {
        if (!clubId || !attendanceDate) return;
        setAttendanceLoading(true);
        try {
            const data = await getAttendanceByDate(
                Number(clubId),
                attendanceDate,
                attendanceScheduleId,
            );
            setPresentStudentIds(new Set(data.student_ids));
            setSelectedStudentIds(new Set());
            setError("");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки посещаемости"));
        } finally {
            setAttendanceLoading(false);
        }
    }, [clubId, attendanceDate, attendanceScheduleId]);

    useEffect(() => {
        if (activeTab === "attendance" && clubId) {
            loadAttendanceForDate();
        }
    }, [activeTab, clubId, attendanceDate, attendanceScheduleId, loadAttendanceForDate]);

    const handleAttendanceScheduleChange = (value: string) => {
        attendanceScheduleInitialized.current = true;
        if (value === "unbound") {
            setAttendanceScheduleId(null);
            return;
        }
        const scheduleId = Number(value);
        const slot = scheduleSlots.find((s) => s.id === scheduleId);
        setAttendanceScheduleId(scheduleId);
        if (slot) {
            setAttendanceDate(suggestedDateForScheduleDay(slot.day_of_week));
        }
    };

    const handleAttendanceDateChange = (value: string) => {
        if (!value) return;
        if (selectedScheduleSlot) {
            setAttendanceDate(
                isDateOnScheduleWeekday(value, selectedScheduleSlot.day_of_week)
                    ? value
                    : snapDateToScheduleWeekday(value, selectedScheduleSlot.day_of_week),
            );
            return;
        }
        setAttendanceDate(value);
    };

    const handleAttendanceTodayClick = () => {
        if (selectedScheduleSlot) {
            if (isScheduleDayToday(selectedScheduleSlot.day_of_week)) {
                setAttendanceDate(todayIsoDate());
            } else {
                setAttendanceDate(suggestedDateForScheduleDay(selectedScheduleSlot.day_of_week));
            }
            return;
        }
        setAttendanceDate(todayIsoDate());
    };

    const handleBackClick = () => {
        navigate("/account/teacher");
    };

    const unmarkedStudentIds = students
        .map((s) => s.student_id)
        .filter((id) => !presentStudentIds.has(id));

    const toggleStudentSelection = (studentId: number) => {
        if (presentStudentIds.has(studentId)) return;
        setSelectedStudentIds((prev) => {
            const next = new Set(prev);
            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                next.add(studentId);
            }
            return next;
        });
    };

    const handleSelectUnmarked = () => {
        setSelectedStudentIds(new Set(unmarkedStudentIds));
    };

    const handleClearSelection = () => {
        setSelectedStudentIds(new Set());
    };

    const markStudents = async (studentIds: number[], successLabel: string) => {
        if (!clubId || !attendanceDate || studentIds.length === 0) return;

        setMarkingAttendance(true);
        try {
            const result = await markAttendanceBulk(Number(clubId), {
                date: attendanceDate,
                student_ids: studentIds,
                schedule_id: attendanceScheduleId,
            });
            await loadAttendanceForDate();
            if (activeTab === "students") {
                await loadData();
            }
            setError("");

            if (result.marked_count > 0) {
                const suffix =
                    result.skipped_count > 0
                        ? ` (${result.skipped_count} уже были отмечены)`
                        : "";
                showToast(`${successLabel}: ${result.marked_count}${suffix}`);
            } else if (result.skipped_count > 0) {
                showToast("Все выбранные студенты уже отмечены на эту дату", "info");
            }
        } catch (err: unknown) {
            const message = getErrorMessage(err, "Ошибка отметки посещения");
            setError(message);
            showToast(message, "error");
        } finally {
            setMarkingAttendance(false);
        }
    };

    const handleMarkSelected = () => {
        const ids = [...selectedStudentIds].filter((id) => !presentStudentIds.has(id));
        if (ids.length === 0) {
            showToast("Выберите студентов для отметки", "info");
            return;
        }
        void markStudents(ids, "Отмечено студентов");
    };

    const handleMarkAll = () => {
        if (unmarkedStudentIds.length === 0) {
            showToast("Все студенты уже отмечены на эту дату", "info");
            return;
        }
        void markStudents(unmarkedStudentIds, "Отмечено студентов");
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
            showToast("Настройки кружка сохранены");
        } catch (err: unknown) {
            const message = getErrorMessage(err, "Ошибка сохранения");
            setError(message);
            showToast(message, "error");
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
            showToast("Занятие добавлено в расписание");
        } catch (err: unknown) {
            const message = getErrorMessage(err, "Ошибка добавления занятия");
            setError(message);
            showToast(message, "error");
        }
    };

    const handleDeleteSchedule = async (scheduleId: number) => {
        try {
            await deleteScheduleItem(Number(clubId), scheduleId);
            await loadData();
            showToast("Занятие удалено из расписания");
        } catch (err: unknown) {
            const message = getErrorMessage(err, "Ошибка удаления занятия");
            setError(message);
            showToast(message, "error");
        }
    };

    const handleToggleRecruitment = () => {
        if (settings) {
            setSettings({ ...settings, recruitment_open: !settings.recruitment_open });
        }
    };

    const handleClubImageUpload = async (file: File) => {
        if (!clubId || !settings) return;
        const allowedTypes = ["image/jpeg", "image/png"];
        const maxSizeBytes = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            setError("Разрешены только JPG и PNG");
            showToast("Разрешены только JPG и PNG", "error");
            return;
        }
        if (file.size > maxSizeBytes) {
            setError("Файл слишком большой (максимум 5 МБ)");
            showToast("Файл слишком большой (максимум 5 МБ)", "error");
            return;
        }

        setImageUploading(true);
        setError("");
        try {
            const response = await updateClubImage(Number(clubId), file);
            setSettings({ ...settings, image_url: response.image_url });
            showToast("Изображение кружка обновлено");
        } catch (err: unknown) {
            const message = getErrorMessage(err, "Ошибка загрузки изображения");
            setError(message);
            showToast(message, "error");
        } finally {
            setImageUploading(false);
        }
    };

    const handleCreateAnnouncement = async () => {
        if (!clubId || !announcementForm.image || !announcementForm.title.trim() || !announcementForm.description.trim()) {
            setError("Заполните поля объявления и выберите изображение");
            return;
        }
        setAnnouncementSaving(true);
        try {
            await createAnnouncement({
                club_id: Number(clubId),
                title: announcementForm.title.trim(),
                description: announcementForm.description.trim(),
                image: announcementForm.image,
            });
            setAnnouncementForm({ title: "", description: "", image: null });
            await loadData();
            setError("");
            showToast("Объявление опубликовано");
        } catch (err: unknown) {
            const message = getErrorMessage(err, "Ошибка публикации объявления");
            setError(message);
            showToast(message, "error");
        } finally {
            setAnnouncementSaving(false);
        }
    };

    const handleDeleteAnnouncement = async (announcementId: number) => {
        try {
            await deleteAnnouncement(announcementId);
            await loadData();
            showToast("Объявление удалено");
        } catch (err: unknown) {
            const message = getErrorMessage(err, "Ошибка удаления объявления");
            setError(message);
            showToast(message, "error");
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

    if (loading && !settings && (activeTab === "settings" || activeTab === "announcements")) {
        return <div className="loading-message">Загрузка...</div>;
    }

    return (
        <div className="management-container">
            <Navbar />
            <div className="management-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад к моим кружкам
                </button>
            </div>

            <div className="management-content">
                <h1 className="management-title">{settings?.title || "Панель преподавателя"}</h1>
                <div className="total-students-card">
                    <div className="total-students-number">{totalStudents}</div>
                    <div className="total-students-label">Всего студентов</div>
                </div>

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
                    <button
                        className={`tab-button ${activeTab === "announcements" ? "active" : ""}`}
                        onClick={() => setActiveTab("announcements")}
                    >
                        Объявления
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

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
                            <p className="attendance-hint">
                                Выберите занятие из расписания и дату проведения — затем отметьте присутствующих списком.
                            </p>

                            {scheduleSlots.length > 0 ? (
                                <div className="form-group">
                                    <label className="form-label">Занятие по расписанию</label>
                                    <select
                                        className="form-select attendance-schedule-select"
                                        value={
                                            attendanceScheduleId != null
                                                ? String(attendanceScheduleId)
                                                : "unbound"
                                        }
                                        onChange={(e) => handleAttendanceScheduleChange(e.target.value)}
                                    >
                                        {scheduleSlots.map((slot) => (
                                            <option key={slot.id} value={slot.id}>
                                                {formatScheduleSlot(slot)}
                                            </option>
                                        ))}
                                        <option value="unbound">Вне расписания</option>
                                    </select>
                                    {selectedScheduleSlot ? (
                                        <p className="attendance-schedule-note">
                                            {isScheduleDayToday(selectedScheduleSlot.day_of_week)
                                                ? "Сегодня день этого занятия по расписанию"
                                                : `В календаре доступен только ${selectedScheduleSlot.day_of_week}`}
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="attendance-schedule-note">
                                    Добавьте расписание во вкладке «Настройки», чтобы привязывать посещаемость к занятиям.
                                </p>
                            )}

                            <div className="attendance-date-row">
                                <div className="form-group attendance-date-field">
                                    <label className="form-label">Дата занятия</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={attendanceDate}
                                        onChange={(e) => handleAttendanceDateChange(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="attendance-today-button"
                                    onClick={handleAttendanceTodayClick}
                                >
                                    {selectedScheduleSlot &&
                                    !isScheduleDayToday(selectedScheduleSlot.day_of_week)
                                        ? "Ближайший день"
                                        : "Сегодня"}
                                </button>
                                {selectedScheduleSlot ? (
                                    <button
                                        type="button"
                                        className="attendance-today-button"
                                        onClick={() =>
                                            setAttendanceDate(
                                                suggestedDateForScheduleDay(selectedScheduleSlot.day_of_week),
                                            )
                                        }
                                    >
                                        Дата по расписанию
                                    </button>
                                ) : null}
                            </div>

                            <p className="attendance-summary">
                                {selectedScheduleSlot
                                    ? `${formatScheduleSlot(selectedScheduleSlot)} · `
                                    : attendanceScheduleId === null && scheduleSlots.length > 0
                                      ? "Вне расписания · "
                                      : ""}
                                {attendanceDate} · отмечено {presentStudentIds.size} из {students.length}
                                {attendanceLoading ? " · загрузка..." : ""}
                            </p>

                            {students.length === 0 ? (
                                <p className="attendance-empty">В кружке пока нет записанных студентов.</p>
                            ) : (
                                <>
                                    <div className="attendance-toolbar">
                                        <button
                                            type="button"
                                            className="attendance-toolbar-button"
                                            onClick={handleSelectUnmarked}
                                            disabled={unmarkedStudentIds.length === 0 || markingAttendance}
                                        >
                                            Выбрать неотмеченных
                                        </button>
                                        <button
                                            type="button"
                                            className="attendance-toolbar-button"
                                            onClick={handleClearSelection}
                                            disabled={selectedStudentIds.size === 0 || markingAttendance}
                                        >
                                            Сбросить выбор
                                        </button>
                                        <button
                                            type="button"
                                            className="mark-attendance-button"
                                            onClick={handleMarkSelected}
                                            disabled={markingAttendance || selectedStudentIds.size === 0}
                                        >
                                            {markingAttendance
                                                ? "Отметка..."
                                                : `Отметить выбранных (${selectedStudentIds.size})`}
                                        </button>
                                        <button
                                            type="button"
                                            className="mark-attendance-button mark-attendance-button--secondary"
                                            onClick={handleMarkAll}
                                            disabled={markingAttendance || unmarkedStudentIds.length === 0}
                                        >
                                            Отметить всех
                                        </button>
                                    </div>

                                    <ul className="attendance-roster">
                                        {students.map((student) => {
                                            const isPresent = presentStudentIds.has(student.student_id);
                                            const isSelected = selectedStudentIds.has(student.student_id);
                                            return (
                                                <li
                                                    key={student.student_id}
                                                    className={`attendance-roster-item${isPresent ? " attendance-roster-item--present" : ""}`}
                                                >
                                                    <label className="attendance-roster-label">
                                                        <input
                                                            type="checkbox"
                                                            className="attendance-roster-checkbox"
                                                            checked={isPresent || isSelected}
                                                            disabled={isPresent || markingAttendance}
                                                            onChange={() => toggleStudentSelection(student.student_id)}
                                                        />
                                                        <span className="attendance-roster-name">
                                                            {student.student_name}
                                                        </span>
                                                        {isPresent && (
                                                            <span className="attendance-roster-badge">Присутствовал</span>
                                                        )}
                                                    </label>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            )}
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
                                <FileInput
                                    label="Изображение кружка"
                                    accept="image/png,image/jpeg"
                                    previewUrl={settings.image_url}
                                    onChange={(file) => file && handleClubImageUpload(file)}
                                    disabled={imageUploading}
                                    hint="JPG или PNG, до 5 МБ"
                                    buttonText={imageUploading ? "Загрузка..." : "Загрузить изображение"}
                                />
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
                    {activeTab === "announcements" && (
                        <div className="settings-tab">
                            <h3 className="tab-title">Объявления</h3>
                            <div className="schedule-editor">
                                <div className="schedule-form">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Заголовок объявления"
                                        value={announcementForm.title}
                                        onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                    />
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Текст объявления"
                                        value={announcementForm.description}
                                        onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })}
                                    />
                                    <FileInput
                                        accept="image/png,image/jpeg"
                                        value={announcementForm.image}
                                        onChange={(file) =>
                                            setAnnouncementForm({ ...announcementForm, image: file })
                                        }
                                        hint="JPG или PNG для объявления"
                                        buttonText="Выбрать изображение"
                                    />
                                    <button className="add-schedule-button" onClick={handleCreateAnnouncement} disabled={announcementSaving}>
                                        {announcementSaving ? "Публикация..." : "Опубликовать"}
                                    </button>
                                </div>
                                <div className="schedule-list">
                                    {announcements.map((item) => (
                                        <div key={item.id} className="schedule-item">
                                            <div className="schedule-info">
                                                <span className="schedule-day">{item.title}</span>
                                                <span className="schedule-location">{item.author_name}</span>
                                            </div>
                                            <button className="delete-schedule-button" onClick={() => handleDeleteAnnouncement(item.id)}>
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
