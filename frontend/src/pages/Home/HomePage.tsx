import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import ClubCard from "../../components/ClubCard/ClubCard";
import { Button, Chip } from "../../shared/components";
import { getClubs, getCategories } from "../../api/clubs";
import type { Club, ClubFilters } from "../../api/clubs";
import { Seo } from "../../seo/seo";
import { getErrorMessage } from "../../utils/errors";
import "./HomePage.css";

export default function HomePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeCategory, setActiveCategory] = useState("Все");
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const skipSearchPageReset = useRef(true);
    const [recruitmentOpenOnly, setRecruitmentOpenOnly] = useState(false);
    const [minMaxStudents, setMinMaxStudents] = useState("");
    const [sortBy, setSortBy] = useState<"id" | "title" | "category" | "max_students">("id");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [categories, setCategories] = useState<string[]>(["Все"]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const qCategory = searchParams.get("category");
        const qSearch = searchParams.get("search");
        const qRecruitment = searchParams.get("recruitment_open");
        const qMinMax = searchParams.get("min_max_students");
        const qSortBy = searchParams.get("sort_by");
        const qSortOrder = searchParams.get("sort_order");
        const qPage = searchParams.get("page");
        const qPageSize = searchParams.get("page_size");

        if (qCategory) setActiveCategory(qCategory);
        if (qSearch) {
            setSearchInput(qSearch);
            setDebouncedSearch(qSearch);
        }
        if (qRecruitment) setRecruitmentOpenOnly(qRecruitment === "true");
        if (qMinMax) setMinMaxStudents(qMinMax);
        if (qSortBy === "id" || qSortBy === "title" || qSortBy === "category" || qSortBy === "max_students") setSortBy(qSortBy);
        if (qSortOrder === "asc" || qSortOrder === "desc") setSortOrder(qSortOrder);
        if (qPage) setPage(Number(qPage));
        if (qPageSize) setPageSize(Number(qPageSize));
    }, [searchParams]);

    const loadData = useCallback(async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки категорий"));
        }
    }, []);

    const loadClubs = useCallback(async () => {
        setLoading(true);
        try {
            const filters: ClubFilters = {
                category: activeCategory === "Все" ? undefined : activeCategory,
                search: debouncedSearch.trim() || undefined,
                recruitment_open: recruitmentOpenOnly ? true : undefined,
                min_max_students: minMaxStudents ? Number(minMaxStudents) : undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
                page,
                page_size: pageSize,
            };
            const response = await getClubs(filters);
            setClubs(response.items);
            setTotal(response.total);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки кружков"));
        } finally {
            setLoading(false);
        }
    }, [activeCategory, debouncedSearch, recruitmentOpenOnly, minMaxStudents, sortBy, sortOrder, page, pageSize]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 400);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        if (skipSearchPageReset.current) {
            skipSearchPageReset.current = false;
            return;
        }
        setPage(1);
    }, [debouncedSearch]);

    const didInit = useRef(false);
    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;
        loadData();
    }, [loadData]);

    useEffect(() => {
        loadClubs();
    }, [loadClubs]);

    useEffect(() => {
        const params: Record<string, string> = {
            category: activeCategory,
            sort_by: sortBy,
            sort_order: sortOrder,
            page: String(page),
            page_size: String(24),
        };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (recruitmentOpenOnly) params.recruitment_open = "true";
        if (minMaxStudents) params.min_max_students = minMaxStudents;
        setSearchParams(params, { replace: true });
    }, [activeCategory, debouncedSearch, recruitmentOpenOnly, minMaxStudents, sortBy, sortOrder, page, pageSize, setSearchParams]);



    const handleClubClick = (clubId: number) => {
        navigate(`/clubs/${clubId}`);
    };

    const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
    const canonicalUrl = `${siteUrl}/clubs`;

    return (
        <>
            <Seo
                title="Кружки МТУСИ — каталог студенческих кружков"
                description="Каталог студенческих кружков: направления, расписание и набор. Найдите кружок по интересам."
                canonicalUrl={canonicalUrl}
                openGraph={{
                    title: "Кружки МТУСИ",
                    description: "Каталог студенческих кружков: направления, расписание и набор.",
                    url: canonicalUrl,
                    type: "website",
                }}
            />
            <Navbar />

            <div className="home-container">
                <h1 style={{ marginBottom: "24px" }}>Каталог кружков</h1>
                <div className="chips">
                    {categories.map((category, i) => (
                        <Chip
                            key={i}
                            active={activeCategory === category}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </Chip>
                    ))}
                </div>

                <div className="filters-panel">
                    <input
                        className="filter-input"
                        placeholder="Поиск по названию, описанию, категории"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <input
                        className="filter-input filter-small"
                        type="number"
                        min={1}
                        placeholder="Мин. лимит"
                        value={minMaxStudents}
                        onChange={(e) => {
                            setMinMaxStudents(e.target.value);
                            setPage(1);
                        }}
                    />
                    <label className="checkbox-wrap">
                        <input
                            type="checkbox"
                            checked={recruitmentOpenOnly}
                            onChange={(e) => {
                                setRecruitmentOpenOnly(e.target.checked);
                                setPage(1);
                            }}
                        />
                        Только открытые
                    </label>
                    <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                        <option value="id">Новые сначала</option>
                        <option value="title">Название</option>
                        <option value="category">Категория</option>
                        <option value="max_students">Лимит мест</option>
                    </select>
                    <select className="filter-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}>
                        <option value="desc">По убыванию</option>
                        <option value="asc">По возрастанию</option>
                    </select>
                </div>

                {loading ? (
                    <div className="loading-message">Загрузка...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <>
                        <div className="cards-grid">
                            {clubs.map((club) => (
                                <ClubCard
                                    key={club.id}
                                    title={club.title}
                                    category={club.category}
                                    imageUrl={club.image_url}
                                    onClick={() => handleClubClick(club.id)}
                                />
                            ))}
                        </div>

                        {clubs.length === 0 && (
                            <div className="no-clubs-message">
                                Кружки в данной категории не найдены
                            </div>
                        )}

                        {clubs.length > 0 && (
                            <div className="pagination">
                                <Button variant="primary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                    Назад
                                </Button>
                                <span className="page-info">
                                    Страница {page} из {Math.max(1, Math.ceil(total / pageSize))} (всего {total})
                                </span>
                                <Button
                                    variant="primary"
                                    disabled={page >= Math.ceil(total / pageSize)}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Вперед
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
