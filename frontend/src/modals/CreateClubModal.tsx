import { useState } from "react";
import type { CreateClubRequest } from "../api/clubs";
import "./CreateClubModal.css";

interface CreateClubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (clubData: CreateClubRequest) => void;
    categories?: string[];
}

export default function CreateClubModal({ isOpen, onClose, onCreate, categories = [] }: CreateClubModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        maxStudents: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const clubData: CreateClubRequest = {
            title: formData.title,
            description: formData.description || undefined,
            category: formData.category,
            max_students: parseInt(formData.maxStudents)
        };
        await onCreate(clubData);
        setFormData({ title: "", description: "", category: "", maxStudents: "" });
    };

    const handleClose = () => {
        setFormData({ title: "", description: "", category: "", maxStudents: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">Создать кружок</h2>
                    <button className="close-button" onClick={handleClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Название кружка</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Описание</label>
                        <textarea
                            className="form-textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Категория</label>
                        <select
                            className="form-select"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            required
                        >
                            <option value="">Выберите категорию</option>
                            {categories.map((category, index) => (
                                <option key={index} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Максимум студентов</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.maxStudents}
                            onChange={(e) => setFormData({...formData, maxStudents: e.target.value})}
                            min="1"
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-button" onClick={handleClose}>
                            Отмена
                        </button>
                        <button type="submit" className="create-button">
                            Создать
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}