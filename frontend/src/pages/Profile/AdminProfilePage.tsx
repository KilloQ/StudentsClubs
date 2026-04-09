import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { getUsers, updateUserRole, type UserAdmin } from "../../api/admin";
import { getErrorMessage } from "../../utils/errors";
import "./AdminProfilePage.css";

const ROLE_LABELS: Record<string, string> = {
    student: "Студент",
    teacher: "Преподаватель",
    admin: "Администратор",
};

export default function AdminProfilePage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [changingId, setChangingId] = useState<number | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setError("");
            const data = await getUsers();
            setUsers(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Ошибка загрузки пользователей"));
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

    if (loading) {
        return <div className="admin-loading">Загрузка...</div>;
    }

    return (
        <div className="admin-profile-container">
            <div className="admin-profile-header">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад
                </button>
                <h1 className="admin-profile-title">Профиль администратора</h1>
            </div>

            <div className="admin-profile-content">
                <div className="admin-user-info">
                    <h2 className="admin-section-title">Пользователи и роли</h2>
                    <p className="admin-section-desc">Изменяйте роли пользователей в системе.</p>
                </div>

                {error && <div className="admin-error">{error}</div>}

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
                                            title={u.id === currentUser?.id ? "Нельзя изменить свою роль" : undefined}
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
            </div>
        </div>
    );
}
