FROM oven/bun:1.3.14-slim

WORKDIR /app

COPY serve/server.ts serve/install serve/install.ps1 ./
COPY releases/ ./releases/
RUN mkdir -p public && \
    cp install public/install && \
    cp install.ps1 public/install.ps1

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
