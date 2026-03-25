# Build — copia só o necessário (evita enviar android/, ios/, src-tauri/ = 12GB+)
ARG VITE_API_URL=http://localhost:3000/api
FROM node:20-alpine AS builder

WORKDIR /app
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY index.html ./
COPY vite.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY src ./src
# Coloca em /backend para o alias @backend (path.resolve(__dirname, '..', 'backend')) no Vite
COPY backend /backend
COPY public ./public
RUN npm run build

# Servir com nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
