import { useState, type FormEvent, type MouseEvent } from "react";
import { X } from "lucide-react";
import type { CreateClubRequest } from "../api/clubs";
import { Button } from "../shared/components";
import "./CreateClubModal.css";

interface CreateClubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (clubData: CreateClubRequest) => void;
    categories?: string[];
}

const emptyForm = {
    title: "",
    description: "",
    category: "",
    maxStudents: "",
};

export default function CreateClubModal({ isOpen, onClose, onCreate, categories = [] }: CreateClubModalProps) {
    const [formData, setFormData] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const clubData: CreateClubRequest = {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            category: formData.category,
            max_students: parseInt(formData.maxStudents, 10),
        };

        try {
            setSubmitting(true);
            await onCreate(clubData);
            setFormData(emptyForm);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData(emptyForm);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="create-club-modal-overlay" onClick={handleClose}>
            <div
                className="create-club-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-club-modal-title"
                onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
                <div className="create-club-modal__header">
                    <h2 id="create-club-modal-title" className="create-club-modal__title">
                        Создать кружок
                    </h2>
                    <button
                        type="button"
                        className="create-club-modal__close"
                        onClick={handleClose}
                        aria-label="Закрыть"
                    >
                        <X size={20} aria-hidden />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="create-club-modal__form">
                    <div className="create-club-modal__field">
                        <label className="create-club-modal__label" htmlFor="club-title">
                            Название кружка
                        </label>
                        <input
                            id="club-title"
                            type="text"
                            className="create-club-modal__input"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Например, Робототехника"
                            required
                        />
                    </div>

                    <div className="create-club-modal__field">
                        <label className="create-club-modal__label" htmlFor="club-description">
                            Описание
                        </label>
                        <textarea
                            id="club-description"
                            className="create-club-modal__textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Кратко опишите, чем занимается кружок"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="create-club-modal__field">
                        <label className="create-club-modal__label" htmlFor="club-category">
                            Категория
                        </label>
                        <select
                            id="club-category"
                            className="create-club-modal__select"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                        >
                            <option value="">Выберите категорию</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="create-club-modal__field">
                        <label className="create-club-modal__label" htmlFor="club-max-students">
                            Максимум студентов
                        </label>
                        <input
                            id="club-max-students"
                            type="number"
                            className="create-club-modal__input"
                            value={formData.maxStudents}
                            onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                            min={1}
                            placeholder="20"
                            required
                        />
                    </div>

                    <div className="create-club-modal__actions">
                        <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
                            Отмена
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? "Создание..." : "Создать"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
