import { useState, useEffect, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../contexts/useAuth";
import {
    getUsers,
    updateUserRole,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    type UserAdmin,
    type ClubCategory,
} from "../../api/admin";
import { getErrorMessage } from "../../utils/errors";
import AdminCollapsibleSection from "./AdminCollapsibleSection";
import AdminSortableCategoryItem from "./AdminSortableCategoryItem";
import "./AdminProfilePage.css";

const ROLE_LABELS: Record<string, string> = {
    student: "Студент",
    teacher: "Преподаватель",
    admin: "Администратор",
};

export default function AdminProfilePage() {
    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth();
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [categories, setCategories] = useState<ClubCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [changingId, setChangingId] = useState<number | null>(null);
    const [categorySavingId, setCategorySavingId] = useState<number | null>(null);
    const [categoryDeletingId, setCategoryDeletingId] = useState<number | null>(null);
    const [isReorderingCategories, setIsReorderingCategories] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [nameDrafts, setNameDrafts] = useState<Record<number, string>>({});
    const [categoriesExpanded, setCategoriesExpanded] = useState(true);
    const [usersExpanded, setUsersExpanded] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    useEffect(() => {
        loadAll();
    }, []);

    const syncNameDrafts = (data: ClubCategory[]) => {
        setNameDrafts(Object.fromEntries(data.map((c) => [c.id, c.name])));
    };

    const loadUsers = async () => {
        const data = await getUsers();
        setUsers(data);
    };

    const loadCategories = async () => {
        const data = await getCategories();
        setCategories(data);
        syncNameDrafts(data);
    };

    const loadAll = async () => {
        try {
            setError("");
            await Promise.all([loadUsers(), loadCategories()]);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки данных"));
        } finally {
            setLoading(false);
        }
    };

    const handleBackClick = () => {
        navigate("/clubs");
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            setChangingId(userId);
            setError("");
            await updateUserRole(userId, newRole);
            await loadUsers();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка изменения роли"));
        } finally {
            setChangingId(null);
        }
    };

    const handleCreateCategory = async (e: FormEvent) => {
        e.preventDefault();
        const name = newCategoryName.trim();
        if (!name) return;

        try {
            setIsCreatingCategory(true);
            setError("");
            await createCategory({ name });
            setNewCategoryName("");
            await loadCategories();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка создания категории"));
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleSaveCategory = async (categoryId: number) => {
        const name = nameDrafts[categoryId]?.trim();
        if (!name) return;

        try {
            setCategorySavingId(categoryId);
            setError("");
            await updateCategory(categoryId, { name });
            await loadCategories();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка сохранения категории"));
        } finally {
            setCategorySavingId(null);
        }
    };

    const handleDeleteCategory = async (categoryId: number) => {
        const category = categories.find((c) => c.id === categoryId);
        if (!category) return;
        if (!window.confirm(`Удалить направление «${category.name}»?`)) return;

        try {
            setCategoryDeletingId(categoryId);
            setError("");
            await deleteCategory(categoryId);
            await loadCategories();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка удаления категории"));
        } finally {
            setCategoryDeletingId(null);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = categories.findIndex((c) => c.id === active.id);
        const newIndex = categories.findIndex((c) => c.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const reordered = arrayMove(categories, oldIndex, newIndex);
        setCategories(reordered);

        try {
            setIsReorderingCategories(true);
            setError("");
            const saved = await reorderCategories({ ordered_ids: reordered.map((c) => c.id) });
            setCategories(saved);
            syncNameDrafts(saved);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка изменения порядка"));
            await loadCategories();
        } finally {
            setIsReorderingCategories(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            navigate("/login", { replace: true });
        } finally {
            setIsLoggingOut(false);
            setIsLogoutModalOpen(false);
        }
    };

    if (loading) {
        return <div className="admin-loading">Загрузка...</div>;
    }

    return (
        <div className="admin-profile-container">
            <Navbar />
            <div className="admin-profile-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад
                </button>
            </div>

            <div className="admin-profile-content">
                <h1 className="admin-profile-title">Профиль администратора</h1>
                <div className="admin-user-info">
                    <button className="logout-profile-button" onClick={() => setIsLogoutModalOpen(true)}>
                        Выйти из профиля
                    </button>
                </div>

                {error && <div className="admin-error">{error}</div>}

                <AdminCollapsibleSection
                    title="Направления каталога"
                    description="Перетаскивайте направления для изменения порядка. Пункт «Все» добавляется автоматически."
                    expanded={categoriesExpanded}
                    onToggle={() => setCategoriesExpanded((v) => !v)}
                >
                    <form className="admin-category-form" onSubmit={handleCreateCategory}>
                        <input
                            className="admin-category-input admin-category-input-grow"
                            placeholder="Название направления"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            maxLength={80}
                            required
                        />
                        <button className="admin-category-add-button" type="submit" disabled={isCreatingCategory}>
                            {isCreatingCategory ? "Добавление..." : "Добавить"}
                        </button>
                    </form>

                    {isReorderingCategories && (
                        <p className="admin-reorder-hint">Сохранение порядка...</p>
                    )}

                    {categories.length === 0 ? (
                        <p className="admin-empty-message">
                            Направления не заданы. Добавьте первое направление выше.
                        </p>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext
                                items={categories.map((c) => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul className="admin-category-list">
                                    {categories.map((category) => (
                                        <AdminSortableCategoryItem
                                            key={category.id}
                                            category={category}
                                            name={nameDrafts[category.id] ?? category.name}
                                            isSaving={categorySavingId === category.id}
                                            isDeleting={categoryDeletingId === category.id}
                                            isReordering={isReorderingCategories}
                                            onNameChange={(name) =>
                                                setNameDrafts((prev) => ({ ...prev, [category.id]: name }))
                                            }
                                            onSave={() => handleSaveCategory(category.id)}
                                            onDelete={() => handleDeleteCategory(category.id)}
                                        />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    )}
                </AdminCollapsibleSection>

                <AdminCollapsibleSection
                    title="Пользователи и роли"
                    description="Изменяйте роли пользователей в системе."
                    expanded={usersExpanded}
                    onToggle={() => setUsersExpanded((v) => !v)}
                >
                    <div className="admin-users-table-wrap">
                        <table className="admin-users-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Логин</th>
                                    <th>ФИО</th>
                                    <th>Роль</th>
                                    <th>Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.id}</td>
                                        <td>{u.username}</td>
                                        <td>{u.full_name}</td>
                                        <td>
                                            <span className={`role-badge role-${u.role}`}>
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                className="role-select"
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={changingId === u.id || u.id === currentUser?.id}
                                                title={
                                                    u.id === currentUser?.id
                                                        ? "Нельзя изменить свою роль"
                                                        : undefined
                                                }
                                            >
                                                <option value="student">Студент</option>
                                                <option value="teacher">Преподаватель</option>
                                                <option value="admin">Администратор</option>
                                            </select>
                                            {changingId === u.id && (
                                                <span className="saving-indicator">Сохранение...</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AdminCollapsibleSection>
            </div>
            {isLogoutModalOpen && (
                <div className="logout-modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
                    <div
                        className="logout-modal"
                        onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
                    >
                        <h3 className="logout-modal-title">Вы точно хотите выйти?</h3>
                        <div className="logout-modal-actions">
                            <button
                                className="logout-modal-button secondary"
                                onClick={() => setIsLogoutModalOpen(false)}
                                disabled={isLoggingOut}
                            >
                                Отмена
                            </button>
                            <button
                                className="logout-modal-button primary"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? "Выход..." : "Выйти"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
