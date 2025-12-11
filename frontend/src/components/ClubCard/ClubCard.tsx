import "./ClubCard.css";

interface ClubCardProps {
    title: string;
    category: string;
    imageUrl?: string;
    onClick?: () => void;
}

export default function ClubCard({ title, category, imageUrl, onClick }: ClubCardProps) {
    return (
        <div className="club-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="club-image" />
            ) : (
                <div className="club-gradient"></div>
            )}
            
            <div className="club-info">
                <h3>{title}</h3>
                <span className="club-tag">{category}</span>
            </div>
        </div>
    );
}
