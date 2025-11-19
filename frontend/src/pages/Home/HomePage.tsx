import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import ClubCard from "../../components/ClubCard/ClubCard";
import "./HomePage.css";

export default function HomePage() {
    const [activeCategory, setActiveCategory] = useState("Все");

    const categories = [
        "Все",
        "Спортивные",
        "Творчество",
        "Точные науки",
        "Инжиниринг",
        "БПЛА",
        "Информационная безопасность",
        "Связь",
        "Программирование"
    ];

    const clubs = [
        { title: "Футбол", category: "Спортивные" },
        { title: "Волейбол", category: "Спортивные" },
        { title: "Баскетбол", category: "Спортивные" },
        { title: "Шахматы", category: "Спортивные" },
        { title: "Туризм", category: "Спортивные" },
        { title: "Настольный теннис", category: "Спортивные" },
        { title: "Разработка мобильных приложений", category: "Программирование" },
    ];

    const filteredClubs = activeCategory === "Все" 
        ? clubs 
        : clubs.filter(club => club.category === activeCategory);

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

                <div className="cards-grid">
                    {filteredClubs.map((club, i) => (
                        <ClubCard
                            key={i}
                            title={club.title}
                            category={club.category}
                        />
                    ))}
                </div>

                {filteredClubs.length === 0 && (
                    <div className="no-clubs-message">
                        Кружки в данной категории не найдены
                    </div>
                )}
            </div>
        </>
    );
}
