# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./

RUN --mount=type=cache,target=/root/.npm \
    for attempt in 1 2 3 4 5; do \
      npm ci && exit 0; \
      echo "npm ci failed (attempt ${attempt}/5), retrying..."; \
      sleep 15; \
    done; \
    exit 1

COPY frontend /app
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
