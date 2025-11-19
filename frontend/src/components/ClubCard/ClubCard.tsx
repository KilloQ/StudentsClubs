import { useNavigate } from "react-router-dom";
import "./ClubCard.css";

interface ClubCardProps {
    title: string;
    category: string;
}

export default function ClubCard({ title, category }: ClubCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/club/${title.toLowerCase()}`);
    };

    return (
        <div className="club-card" onClick={handleClick}>
            <div className="club-gradient"></div>
            
            <div className="club-info">
                <h3>{title}</h3>
                <span className="club-tag">{category}</span>
            </div>
        </div>
    );
}
