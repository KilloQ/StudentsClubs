import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { deleteClubFile, getClub, getClubFileDownloadUrl, getClubFiles, joinClub, leaveClub, uploadClubFile } from "../../api/clubs";
import type { ClubDetail, ClubFile } from "../../api/clubs";
import { getAnnouncements, likeAnnouncement, unlikeAnnouncement, type Announcement } from "../../api/announcements";
import { useAuth } from "../../contexts/useAuth";
import { canJoinOrLeaveClub, canManageClubs } from "../../utils/permissions";
import { Seo } from "../../seo/seo";
import { getErrorMessage } from "../../utils/errors";
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
    const [files, setFiles] = useState<ClubFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    const loadClub = useCallback(async () => {
        try {
            const data = await getClub(Number(clubId));
            setClubData(data);
            if (user) {
                const fileList = await getClubFiles(Number(clubId));
                setFiles(fileList);
            } else {
                setFiles([]);
            }
            const announcementsResponse = await getAnnouncements({ club_id: Number(clubId), page: 1, page_size: 5 });
            setAnnouncements(announcementsResponse.items);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки кружка"));
        } finally {
            setLoading(false);
        }
    }, [clubId, user]);

    useEffect(() => {
        if (clubId) {
            loadClub();
        }
    }, [clubId, loadClub]);


    const handleBackClick = () => {
        navigate("/clubs");
    };

    const handleJoinClick = async () => {
        if (!clubId) return;
        setJoining(true);
        setError("");
        try {
            await joinClub(Number(clubId));
            // Обновляем данные кружка
            await loadClub();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка записи на кружок"));
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
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка отписки от кружка"));
        } finally {
            setLeaving(false);
        }
    };

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!clubId || !event.target.files?.length) return;

        const file = event.target.files[0];
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        const maxSizeBytes = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            setError("Разрешены только JPG, PNG и PDF");
            event.target.value = "";
            return;
        }
        if (file.size > maxSizeBytes) {
            setError("Файл слишком большой (максимум 5 МБ)");
            event.target.value = "";
            return;
        }

        setUploading(true);
        setError("");
        try {
            await uploadClubFile(Number(clubId), file);
            const fileList = await getClubFiles(Number(clubId));
            setFiles(fileList);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки файла"));
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    const handleDownloadFile = async (fileId: number) => {
        if (!clubId) return;
        try {
            const url = await getClubFileDownloadUrl(Number(clubId), fileId);
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка получения ссылки на файл"));
        }
    };

    const handleDeleteFile = async (fileId: number) => {
        if (!clubId) return;
        try {
            await deleteClubFile(Number(clubId), fileId);
            const fileList = await getClubFiles(Number(clubId));
            setFiles(fileList);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка удаления файла"));
        }
    };

    const handleToggleAnnouncementLike = async (announcement: Announcement) => {
        if (!user) return;
        try {
            if (announcement.liked_by_me) {
                await unlikeAnnouncement(announcement.id);
            } else {
                await likeAnnouncement(announcement.id);
            }
            const announcementsResponse = await getAnnouncements({ club_id: Number(clubId), page: 1, page_size: 5 });
            setAnnouncements(announcementsResponse.items);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка изменения лайка"));
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
    const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
    const canonicalUrl = `${siteUrl}/clubs/${clubData.id}`;
    const description = (clubData.description || "").trim() || `Кружок “${clubData.title}” — ${clubData.category}.`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: clubData.title,
        description: description,
        category: clubData.category,
        url: canonicalUrl,
    };

    return (
        <div className="club-page-container">
            <Seo
                title={`${clubData.title} — кружок МТУСИ`}
                description={description.slice(0, 180)}
                canonicalUrl={canonicalUrl}
                openGraph={{
                    title: `${clubData.title} — кружок МТУСИ`,
                    description: description.slice(0, 180),
                    url: canonicalUrl,
                    image: clubData.image_url,
                    type: "article",
                }}
                jsonLd={jsonLd}
            />
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

                        <div className="club-section">
                            <h3 className="section-title">Объявления</h3>
                            <div className="club-announcements-list">
                                {announcements.length === 0 ? (
                                    <div className="file-empty">Для этого кружка объявлений пока нет</div>
                                ) : (
                                    announcements.map((announcement) => (
                                        <article key={announcement.id} className="club-announcement-card">
                                            <img src={announcement.image_url} alt={announcement.title} className="club-announcement-image" />
                                            <div className="club-announcement-body">
                                                <h4>{announcement.title}</h4>
                                                <div className="club-announcement-meta">
                                                    <span>{announcement.author_name}</span>
                                                    <span>{new Date(announcement.created_at).toLocaleString("ru-RU")}</span>
                                                </div>
                                                <p>{announcement.description}</p>
                                                <button
                                                    className={`announcement-like-btn ${announcement.liked_by_me ? "active" : ""}`}
                                                    onClick={() => handleToggleAnnouncementLike(announcement)}
                                                    disabled={!user}
                                                >
                                                    ❤️ {announcement.likes_count}
                                                </button>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="club-section">
                            <h3 className="section-title">Файлы кружка</h3>
                            {!user ? (
                                <div className="file-empty">Войдите, чтобы увидеть файлы кружка</div>
                            ) : null}
                            {canManageClubs(user) && (
                                <div className="file-upload-row">
                                    <input type="file" onChange={handleFileUpload} disabled={uploading} />
                                    {uploading && <span className="uploading-label">Загрузка...</span>}
                                </div>
                            )}
                            <div className="files-list">
                                {files.length === 0 ? (
                                    <div className="file-empty">Файлы пока не добавлены</div>
                                ) : (
                                    files.map((file) => (
                                        <div key={file.id} className="file-item">
                                            <div>
                                                <div className="file-name">{file.original_name}</div>
                                                <div className="file-meta">{Math.round(file.size_bytes / 1024)} KB</div>
                                            </div>
                                            <div className="file-actions">
                                                <button className="file-btn" onClick={() => handleDownloadFile(file.id)}>Открыть</button>
                                                {canManageClubs(user) && (
                                                    <button className="file-btn danger" onClick={() => handleDeleteFile(file.id)}>
                                                        Удалить
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
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