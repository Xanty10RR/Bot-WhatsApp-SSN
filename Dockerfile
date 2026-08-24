# =========================
# FASE DE CONSTRUCCIÓN
# =========================
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --no-cache --virtual .gyp \
    python3 \
    make \
    g++ \
    git

RUN npm ci

COPY . .

RUN npm run build

# Copiar imágenes WebP al directorio del flow compilado
RUN mkdir -p dist/templates/submenus/images \
    && cp -r src/templates/submenus/images/. dist/templates/submenus/images/

RUN apk del .gyp


# =========================
# FASE DE PRODUCCIÓN
# =========================
FROM node:22-alpine AS deploy

WORKDIR /app

# Render proporciona PORT automáticamente
EXPOSE 3001

# Usuario no-root
RUN addgroup -g 1001 -S nodejs \
    && adduser -S -u 1001 nodejs

# Archivos compilados
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/dist ./dist

# Archivos necesarios del proyecto
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/package*.json ./

# Carpeta excels
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/excels ./excels

# Dependencias de producción
RUN npm ci --omit=dev

# Permisos
RUN touch queue.class.log core.class.log \
    && chown -R nodejs:nodejs /app

USER nodejs

CMD ["npm", "start"]