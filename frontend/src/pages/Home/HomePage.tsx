import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import ClubCard from "../../components/ClubCard/ClubCard";
import { getClubs, getCategories } from "../../api/clubs";
import type { Club } from "../../api/clubs";
import "./HomePage.css";

export default function HomePage() {
    const [activeCategory, setActiveCategory] = useState("Все");
    const [categories, setCategories] = useState<string[]>(["Все"]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadClubs();
    }, [activeCategory]);

    const loadData = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (err: any) {
            setError(err.message || "Ошибка загрузки категорий");
        }
    };

    const loadClubs = async () => {
        setLoading(true);
        try {
            const clubsData = await getClubs(activeCategory === "Все" ? undefined : activeCategory);
            setClubs(clubsData);
        } catch (err: any) {
            setError(err.message || "Ошибка загрузки кружков");
        } finally {
            setLoading(false);
        }
    };

    const handleClubClick = (clubId: number) => {
        navigate(`/club/${clubId}`);
    };

    return (
        <>
            <Navbar />

            <div className="home-container">
                <h2>Направление кружка:</h2>

                <div className="chips">
                    {categories.map((category, i) => (
                        <button 
                            key={i} 
                            className={`chip ${activeCategory === category ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
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
                    </>
                )}
            </div>
        </>
    );
}
