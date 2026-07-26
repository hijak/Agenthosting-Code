FROM oven/bun:1 AS builder

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
COPY patches/ patches/
COPY packages/ packages/
RUN bun ci

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
RUN mkdir -p public && \
    cp install public/install && \
    cp install.ps1 public/install.ps1

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
