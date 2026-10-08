# Образ e2e-тестов: Playwright с браузерами. Браузер живёт только здесь,
# на компьютеры команды его не ставим.
# AI: тег образа = версия @playwright/test в package.json, меняются только вместе.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /e2e

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

CMD ["npx", "playwright", "test"]
