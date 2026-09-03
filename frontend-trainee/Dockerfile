# SOIS Trainee Frontend (FE-1) - container runtime (port 3000).
# Orchestration (docker-compose) is owned by Arch/M6; this image is used by it.
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]