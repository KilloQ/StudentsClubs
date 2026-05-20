import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ClubCategory } from "../../api/admin";

type AdminSortableCategoryItemProps = {
    category: ClubCategory;
    name: string;
    isSaving: boolean;
    isDeleting: boolean;
    isReordering: boolean;
    onNameChange: (name: string) => void;
    onSave: () => void;
    onDelete: () => void;
};

export default function AdminSortableCategoryItem({
    category,
    name,
    isSaving,
    isDeleting,
    isReordering,
    onNameChange,
    onSave,
    onDelete,
}: AdminSortableCategoryItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: category.id,
        disabled: isReordering,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`admin-category-item${isDragging ? " admin-category-item--dragging" : ""}`}
        >
            <button
                type="button"
                className="admin-category-drag-handle"
                aria-label={`Переместить «${category.name}»`}
                disabled={isReordering}
                {...attributes}
                {...listeners}
            >
                <GripVertical size={18} aria-hidden />
            </button>
            <input
                className="admin-category-input admin-category-input-grow"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                disabled={isReordering}
            />
            <div className="admin-category-actions">
                <button
                    type="button"
                    className="admin-category-save-button"
                    onClick={onSave}
                    disabled={isSaving || isDeleting || isReordering}
                >
                    {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
                <button
                    type="button"
                    className="admin-category-delete-button"
                    onClick={onDelete}
                    disabled={isSaving || isDeleting || isReordering}
                >
                    {isDeleting ? "Удаление..." : "Удалить"}
                </button>
            </div>
        </li>
    );
}
