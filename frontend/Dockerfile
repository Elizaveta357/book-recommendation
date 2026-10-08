# Образ фронта: Node 24 + зависимости из package-lock.json, dev-сервер Vite.
FROM node:24-alpine

WORKDIR /app

# Сначала только описание зависимостей: слой кэшируется, пока они не поменялись.
COPY package.json package-lock.json ./
# AI: npm ci ставит ровно то, что в package-lock.json, — одинаково у всей команды.
# npm install здесь не годится: он может молча обновить версии.
RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
