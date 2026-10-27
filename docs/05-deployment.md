# Сборка, выпуск и развёртывание

## Локальный запуск

Требуются Docker Desktop и Docker Compose plugin. Подготовьте конфигурацию и запустите все сервисы из корня репозитория:

```powershell
Copy-Item backend\.env.example backend\.env
docker compose up -d --build
.\scripts\check-health.ps1
```

Compose запускает PostgreSQL, MinIO, FastAPI backend и Nginx frontend. Данные находятся в именованных volumes `pgdata` и `miniodata`. Для остановки без удаления данных — `docker compose down`; для удаления данных использовать `docker compose down -v` только при осознанном сбросе локальной базы.

## Версии и сборка

| Элемент | Зафиксированное требование |
|---|---|
| Python backend | 3.12 в `backend/Dockerfile` |
| Python dependencies | Точные версии в `backend/requirements.txt` |
| Node.js | 20 в `frontend/Dockerfile` |
| npm | Поставляется в закреплённом Node image; сборка выполняет `npm ci` |
| npm dependencies | `frontend/package-lock.json`, точное дерево для `npm ci` |
| PostgreSQL | Major version 15 в `docker-compose.yml` |
| Docker base/service images | Закреплены digest’ами в `backend/Dockerfile`, `frontend/Dockerfile` и `docker-compose.yml`; изменение digest требует осознанного обновления |
| Docker Compose | v2.24.0+ рекомендуется для среды курса |

Успешная локальная сборка проверена командой `docker compose up -d --build`. Production images и release tag пока не опубликованы в рамках лабораторной работы.

## Production и секреты

Локальные значения `backend/.env.example` предназначены только для разработки. Перед развёртыванием задайте уникальный `SECRET_KEY`, отдельные MinIO credentials, публичные URL и `EXTERNAL_WEATHER_API_KEY`, если используется погода. Не публикуйте `.env` и не используйте демонстрационные пароли. Публичный сервер/CI deployment требует настроенных GitHub secrets; наличие необходимых secrets здесь не предполагается.

## Текущая автоматизация

В репозитории есть `.github/workflows/ci-cd.yml` и `scripts/deploy.sh`. CI jobs тестирования в workflow выключены комментариями; deploy ссылается на эти jobs, поэтому pipeline необходимо проверить и исправить прежде, чем полагаться на него для выпуска. Скрипт deploy синхронизирует удалённый checkout с `origin/main`; запускать его следует только на предназначенном сервере и после проверки конфигурации.

## Протокол проверки

При выпуске записывать версию/commit, дату, ОС/архитектуру, версии Docker/Compose, результат сборки, smoke checks и способ отката. На момент этой документации зафиксирован только локальный запуск автором 2026-10-27; независимый clean-machine протокол отсутствует.
