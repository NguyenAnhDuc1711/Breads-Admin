# --- Stage 1: build static assets ---
FROM node:20-alpine AS build
RUN apk add --no-cache git
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build context may not carry the submodule's content (e.g. no .git, or
# submodule not init'd on the machine running `docker build`). Re-clone it
# directly instead of relying on that — same fix as Breads-Fe's Dockerfile.
RUN rm -rf src/Breads-Shared && \
    git clone --depth 1 https://github.com/NguyenAnhDuc1711/Breads-Shared.git src/Breads-Shared

# Build-time only: Vite inlines these into the bundle, they cannot be
# changed at container runtime. Rebuild the image to change them.
ARG VITE_API_URL
ARG BASE_PATH=/
ENV VITE_API_URL=${VITE_API_URL}
ENV BASE_PATH=${BASE_PATH}

RUN npm run build

# --- Stage 2: serve static assets ---
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
