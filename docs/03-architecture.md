# Архитектура

## Контекст

React-клиент обращается к FastAPI JSON API. В production/Compose запросы `/api/` проксируются Nginx к backend. Backend использует PostgreSQL для структурированных данных, MinIO для файловых объектов и внешний OpenWeather API для погодных данных.

Исходник диаграммы: [`diagrams/system-context.mmd`](./diagrams/system-context.mmd).

## Компоненты

| Компонент | Ответственность | Реализация |
|---|---|---|
| Web UI | Страницы, формы, сессия пользователя и навигация | `frontend/src/` |
| API client | HTTP-вызовы backend | `frontend/src/api/` |
| API application | Маршруты, валидация, авторизация и бизнес-операции | `backend/app/api/`, `backend/app/main.py` |
| Схемы | Контракты входных и выходных данных | `backend/app/schemas/` |
| Сервисы | Бизнес-логика и адаптеры внешних систем | `backend/app/services/` |
| Persistence | Асинхронный SQLAlchemy, ORM-модели, подключение | `backend/app/db/` |
| PostgreSQL | Пользователи, роли, кружки, связи, расписания и метаданные | Compose service `postgres` |
| MinIO | Двоичные файлы и изображения | Compose service `minio` |
| Nginx | Статические файлы и reverse proxy `/api/` | `frontend/nginx.conf` |

## Поток запроса

1. Клиент загружает SPA через Nginx и вызывает API.
2. Nginx проксирует `/api/...` к FastAPI backend.
3. Endpoint проверяет данные и права, вызывает service/ORM.
4. SQLAlchemy взаимодействует с PostgreSQL; файловый сервис — с MinIO; погодный сервис — с внешним API.
5. Backend сериализует результат в JSON-ответ.

## Данные и конфигурация

Основные таблицы SQLAlchemy описаны в `backend/app/db/models.py`: `User`, `Club`, `ClubCategory`, `ClubMembership`, `Schedule`, `Attendance`, `RefreshToken`, `ClubFile`, `Announcement`, `AnnouncementLike`. Объекты файлов лежат в MinIO, тогда как `ClubFile` хранит владельца, MIME type, размер и object key.

Конфигурация backend читается из переменных окружения и `.env` через Pydantic Settings (`backend/app/core/config.py`). Конфигурация локального Compose предоставлена в `backend/.env.example`. Frontend получает API base URL через `VITE_API_BASE_URL` при сборке; Nginx задаёт runtime reverse proxy.

## Архитектурные решения и ограничения

- Backend/frontend разделены на самостоятельные приложения в одном репозитории.
- API организован по предметным областям в отдельных routers.
- Данные хранятся в PostgreSQL; файловое содержимое вынесено в объектное хранилище.
- В проекте пока нет отдельных зафиксированных ADR и версионируемых миграций Alembic. Решения по их введению оставить для обсуждения в последующих работах.
