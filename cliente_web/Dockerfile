# Dockerfile para aplicación React (modo desarrollo)
FROM node:current-alpine3.21
WORKDIR /app
COPY . .
ENV CI=true
RUN npm install -g pnpm && pnpm install
EXPOSE 3000
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0", "--port", "3000"]
