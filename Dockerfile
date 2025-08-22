# Fase de construcción
FROM node:21-alpine3.18 AS builder

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

COPY . .
COPY package*.json *-lock.yaml ./

RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        g++ \
    && apk add --no-cache git \
    && npm install && npm run build \
    && apk del .gyp

# Fase de producción
FROM node:21-alpine3.18 AS deploy

WORKDIR /app

ARG PORT=3001
ENV PORT=$PORT
EXPOSE $PORT

# 1. Primero creamos el usuario y grupo
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 nodejs

# 2. Copiamos los archivos
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/assets ./assets
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/*-lock.yaml ./

# 3. Configuramos los permisos y dependencias
RUN touch queue.class.log core.class.log && \
    chown -R nodejs:nodejs . && \
    corepack enable && corepack prepare pnpm@latest --activate

ENV PNPM_HOME=/usr/local/bin

# 4. Instalamos dependencias
RUN npm cache clean --force && \
    pnpm install --production --ignore-scripts && \
    rm -rf $PNPM_HOME/.npm $PNPM_HOME/.node-gyp

USER nodejs

CMD ["npm", "start"]