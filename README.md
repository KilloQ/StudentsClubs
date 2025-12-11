# Система управления студенческими кружками

## Технологии

### Backend
- FastAPI
- SQLAlchemy (async)
- PostgreSQL
- JWT аутентификация
- Alembic для миграций

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Lucide React (иконки)

## Установка и запуск

### Требования
- Python 3.9+
- Node.js 18+
- PostgreSQL

### Backend

1. Перейдите в директорию backend:
```bash
cd backend
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
```

3. Активируйте виртуальное окружение:
- Windows:
```bash
venv\Scripts\activate
```
- Linux/Mac:
```bash
source venv/bin/activate
```

4. Установите зависимости:
```bash
pip install -r requirements.txt
```

5. Создайте базу данных PostgreSQL:
   - Откройте psql или pgAdmin
   - Выполните: `CREATE DATABASE students_clubs;`

6. Создайте файл `.env` в директории `backend`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:ваш_пароль@localhost:5432/students_clubs
```

   Где:
   - `postgres` - имя пользователя PostgreSQL (замените на своё, если используете другого пользователя)
   - `ваш_пароль` - пароль пользователя PostgreSQL
   - `localhost:5432` - хост и порт (обычно localhost:5432)
   - `students_clubs` - имя базы данных

   **Подробная инструкция по настройке БД и .env файла:** см. файл `SETUP.md`

6. Инициализируйте базу данных:
```bash
python -m app.db.init_db
```

Это создаст таблицы и создаст преподавателя по умолчанию:
- Логин: `teacher`
- Пароль: `teacher123`

7. Запустите сервер:
```bash
uvicorn app.main:app --reload
```

API будет доступен по адресу: http://localhost:8000

### Frontend

1. Перейдите в директорию frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите dev сервер:
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

## Использование

### Преподаватель
- Логин: `teacher`
- Пароль: `teacher123`

Преподаватель может:
- Создавать кружки
- Управлять кружками (просмотр студентов, отметка посещаемости, настройки)
- Редактировать расписание

### Студент
Любой пользователь, который зарегистрируется с логином и паролем, отличными от преподавателя, будет зарегистрирован как студент.

Студент может:
- Просматривать доступные кружки
- Фильтровать кружки по категориям
- Записываться на кружки
- Просматривать свой профиль с информацией о кружках и посещаемости

## Структура проекта

```
StudentsClubs/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── db/           # Модели БД и инициализация
│   │   ├── schemas/      # Pydantic схемы
│   │   ├── core/         # Конфигурация
│   │   └── main.py       # Точка входа FastAPI
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/          # API клиенты
│   │   ├── components/   # React компоненты
│   │   ├── contexts/     # React контексты (Auth)
│   │   ├── pages/        # Страницы приложения
│   │   ├── types/        # TypeScript типы
│   │   └── main.tsx      # Точка входа React
│   └── package.json
└── README.md
```

## API Endpoints

### Аутентификация
- `POST /auth/login` - Вход
- `POST /auth/register` - Регистрация
- `GET /auth/me` - Текущий пользователь

### Кружки
- `GET /clubs/` - Список кружков (с фильтром по категории)
- `GET /clubs/{club_id}` - Детали кружка
- `POST /clubs/` - Создать кружок (только для преподавателей)
- `POST /clubs/{club_id}/join` - Записаться на кружок
- `GET /clubs/categories/list` - Список категорий

### Профиль
- `GET /profile/student` - Профиль студента
- `GET /profile/teacher` - Профиль преподавателя

### Управление кружком
- `GET /management/{club_id}/students` - Список студентов
- `POST /management/{club_id}/attendance` - Отметить посещаемость
- `GET /management/{club_id}/settings` - Настройки кружка
- `PUT /management/{club_id}/settings` - Обновить настройки
- `POST /management/{club_id}/schedule` - Добавить занятие
- `DELETE /management/{club_id}/schedule/{schedule_id}` - Удалить занятие
- `GET /management/{club_id}/stats` - Статистика кружка

## Особенности реализации

1. **Аутентификация**: JWT токены хранятся в localStorage
2. **Роли**: Автоматическое определение роли при регистрации (если логин совпадает с преподавателем - роль преподавателя)
3. **Защита маршрутов**: Frontend защищает маршруты через ProtectedRoute компонент
4. **Асинхронная БД**: Используется async SQLAlchemy для лучшей производительности

