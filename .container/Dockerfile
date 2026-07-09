FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    mariadb-client \
    nano \
    redis-tools \
    sudo \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=development
ENV PLATFORM_API_PORT=7010
ENV PLATFORM_WEB_PORT=7020
ENV CORE_API_PORT=7030
ENV CORE_WEB_PORT=7040
ENV BILLING_API_PORT=7050
ENV BILLING_WEB_PORT=7060
ENV ACCOUNTS_API_PORT=7070
ENV ACCOUNTS_WEB_PORT=7080
ENV DB_HOST=127.0.0.1
ENV DB_PORT=3306
ENV DB_USER=codexsun
ENV DB_PASSWORD=build-placeholder
ENV DB_MASTER_NAME=codexsun_master
ENV JWT_SECRET=build-placeholder
ENV CODEXSUN_REDIS_URL=redis://127.0.0.1:6379

COPY package.json package-lock.json .npmrc tsconfig.json tsconfig.base.json turbo.json ./
COPY apps ./apps
COPY packages ./packages
COPY tools ./tools

RUN npm ci
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    mariadb-client \
    nano \
    redis-tools \
    sudo \
  && rm -rf /var/lib/apt/lists/* \
  && echo "node ALL=(ALL) NOPASSWD:ALL" >/etc/sudoers.d/node \
  && chmod 0440 /etc/sudoers.d/node

ENV NODE_ENV=production
ENV HOST=0.0.0.0

COPY --from=build /app /app
COPY .container/entrypoint.sh /usr/local/bin/codexsun-entrypoint

RUN chmod +x /usr/local/bin/codexsun-entrypoint

ENTRYPOINT ["codexsun-entrypoint"]
