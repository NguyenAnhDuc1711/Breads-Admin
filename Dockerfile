FROM node:20-alpine AS build
RUN apk add --no-cache git
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN rm -rf src/Breads-Shared && \
    git clone --depth 1 https://github.com/NguyenAnhDuc1711/Breads-Shared.git src/Breads-Shared

ARG VITE_API_URL
ARG BASE_PATH=/
ENV VITE_API_URL=${VITE_API_URL}
ENV BASE_PATH=${BASE_PATH}

RUN npm run build

FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
