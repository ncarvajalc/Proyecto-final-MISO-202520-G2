# Dockerfile para aplicación React (modo desarrollo)
FROM node:current-alpine3.21
WORKDIR /app
COPY . .
ENV CI=true
ENV VITE_API_URL="http://localhost:8080"
RUN npm install -g pnpm && pnpm install
EXPOSE 8080
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0", "--port", "8080"]
