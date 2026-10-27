# Тестирование

## Тестовые уровни и команды

| Уровень | Где находится | Команда |
|---|---|---|
| Backend unit | `backend/tests/unit/` | `cd backend; python -m pytest -m unit -q` |
| Backend integration | `backend/tests/integration/` | `cd backend; python -m pytest -m integration -q` |
| Frontend unit/integration | `frontend/src/**/*.test.ts(x)` | `cd frontend; npm ci; npm test` |
| E2E | `frontend/e2e/` | `cd frontend; npm run test:e2e` |
| Lint | Frontend | `cd frontend; npm run lint` |
| Types/build | Frontend | `cd frontend; npm run build` |
| Smoke check | UI, API health и каталог через прокси | Из корня: `.\scripts\check-health.ps1` |

Backend-тесты используют pytest/pytest-asyncio и SQLite in-memory fixture из `backend/tests/conftest.py`. Frontend unit/integration проверки выполняются Vitest и Testing Library. E2E использует Playwright и требует работающего приложения и установленного browser binary.

Для локального запуска тестов установите Python 3.12 dependencies командой `python -m pip install -r backend/requirements.txt`; frontend dependencies — командой `npm ci` из `frontend/`. При использовании Docker зависимости backend уже установлены в контейнере.

Результаты локальной проверки 2026-10-27:

- Backend suite в контейнере: **13 passed, 1 failed**. Падающий тест `test_admin_category_crud_and_rename_updates_clubs` сначала удаляет новую категорию, затем включает её ID в запрос reorder и ожидает успех. Endpoint отвечает HTTP 400, поскольку переданный набор ID не равен множеству существующих категорий. Требуется исправить сценарий теста или отдельно согласовать другое поведение API.
- Frontend tests: **11 passed, 1 failed**. `LandingPage.integration.test.tsx` падает, потому что `LandingPage` вызывает `useAuth` вне `AuthProvider`.
- ESLint: **не проходит**, три ошибки `@typescript-eslint/no-unused-vars` в `frontend/src/shared/components/Logo/Logo.tsx` и предупреждение о зависимости `loadAll` в `AdminProfilePage.tsx`.
- Frontend build/type check: **успешен** (`tsc -b` + Vite). Vite предупреждает о ссылках на шрифты, не разрешённых при build-time.
- Smoke-check: все три endpoint возвращают HTTP 200.
- E2E в этой проверке не запускались.

Во время `npm ci` npm сообщил о 22 advisory findings (1 low, 4 moderate, 15 high, 2 critical). Они не triaged в рамках этой проверки; перед релизом следует выполнить и рассмотреть `npm audit`.

## Проверка запуска

Протокол локальной проверки 2026-10-27: автор запустил проект в Docker Desktop на Windows; backend health endpoint и frontend вернули HTTP 200. Скрипт `scripts/check-health.ps1` проверяет дополнительно публичный каталог через Nginx proxy. Это не независимая проверка на чужой машине или чистой VM; такой повторный запуск и фиксация проверяющего остаются необходимыми.

## CI

Workflow `.github/workflows/ci-cd.yml` настроен на push/PR в `main`, но фактически backend/frontend jobs закомментированы. Deploy job ссылается в `needs` на неактивные jobs. Поэтому workflow не считается рабочим gate для тестов/развёртывания; это замечание вынесено в черновик issue.

## Рекомендуемый критерий завершения

- Backend unit/integration и frontend tests проходят.
- `npm run lint` и `npm run build` завершаются успешно.
- Smoke check возвращает HTTP 200 для всех трёх проверок.
- E2E критического пользовательского сценария проходит на чистой базе.
- Для выпуска зафиксированы дата, ОС, автор проверки и результаты команд.
