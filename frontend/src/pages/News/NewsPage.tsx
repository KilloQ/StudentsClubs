import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { Button } from "../../shared/components";
import { getAnnouncements, likeAnnouncement, unlikeAnnouncement, type Announcement } from "../../api/announcements";
import { useAuth } from "../../contexts/useAuth";
import { getErrorMessage } from "../../utils/errors";
import "./NewsPage.css";

const PAGE_SIZE = 10;

export default function NewsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<Announcement[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async (nextPage: number) => {
        setLoading(true);
        try {
            const response = await getAnnouncements({ page: nextPage, page_size: PAGE_SIZE });
            setItems(response.items);
            setTotal(response.total);
            setPage(response.page);
            setError("");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки объявлений"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1);
    }, []);

    const handleToggleLike = async (announcement: Announcement) => {
        if (!user) return;
        try {
            if (announcement.liked_by_me) {
                await unlikeAnnouncement(announcement.id);
            } else {
                await likeAnnouncement(announcement.id);
            }
            await load(page);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка изменения лайка"));
        }
    };

    const pagesCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="news-page-container">
            <Navbar />
            <div className="news-page-content">
                <h1 className="news-title">Новости</h1>
                {error && <div className="news-error">{error}</div>}
                {loading ? (
                    <div className="news-placeholder">Загрузка...</div>
                ) : items.length === 0 ? (
                    <div className="news-placeholder">Объявлений пока нет</div>
                ) : (
                    <div className="news-feed">
                        {items.map((item) => (
                            <article key={item.id} className="news-card">
                                <img src={item.image_url} alt={item.title} className="news-image" loading="lazy" />
                                <div className="news-meta">
                                    <span>{item.author_name}</span>
                                    <span>{new Date(item.created_at).toLocaleString("ru-RU")}</span>
                                </div>
                                <h2 className="news-card-title">{item.title}</h2>
                                <p className="news-card-description">{item.description}</p>
                                <div className="news-card-footer">
                                    <Link to={`/clubs/${item.club_id}`} className="news-club-link">{item.club_title}</Link>
                                    <button
                                        className={`news-like-button ${item.liked_by_me ? "active" : ""}`}
                                        onClick={() => handleToggleLike(item)}
                                        disabled={!user}
                                    >
                                        ❤️ {item.likes_count}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
                {items.length > 0 && (
                    <div className="pagination">
                        <Button
                            variant="primary"
                            disabled={page <= 1 || loading}
                            onClick={() => load(Math.max(1, page - 1))}
                        >
                            Назад
                        </Button>
                        <span className="page-info">
                            Страница {page} из {pagesCount} (всего {total})
                        </span>
                        <Button
                            variant="primary"
                            disabled={page >= pagesCount || loading}
                            onClick={() => load(Math.min(pagesCount, page + 1))}
                        >
                            Вперед
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
