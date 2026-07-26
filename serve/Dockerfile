FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun ci

COPY packages/ packages/
COPY serve/ serve/

# Build the CLI binary for linux-x64
RUN cd packages/opencode && MIMOCODE_CHANNEL=local MIMOCODE_VERSION=local bun run script/build.ts --single || true

# Package the binary into a release archive
RUN mkdir -p /releases/v0.1.0-local && \
    if [ -f packages/opencode/bin/ah ]; then \
      tar -czf /releases/v0.1.0-local/ah-linux-x64.tar.gz -C packages/opencode/bin ah && \
      echo "0.1.0-local" > /releases/latest; \
    fi

# --- Runtime ---
FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app/serve/ ./
COPY --from=builder /releases/ ./releases/
RUN mkdir -p public && cp serve/install public/install 2>/dev/null; cp serve/install.ps1 public/install.ps1 2>/dev/null; true

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
