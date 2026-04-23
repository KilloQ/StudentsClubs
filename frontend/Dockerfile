FROM node:20-alpine AS build
WORKDIR /app

# copy package files first to leverage cache
COPY frontend/package.json frontend/package-lock.json* ./
COPY frontend/tsconfig.json frontend/vite.config.ts ./
RUN npm install

# copy rest and build
COPY frontend /app
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
