FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Empty means same-origin API proxy. Use an HTTPS API origin for split hosting.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run lint && npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --chmod=0555 docker/15-validate-ingress.sh /docker-entrypoint.d/15-validate-ingress.sh
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://api:8000 TRUSTED_INGRESS_CIDR=127.0.0.1/32
EXPOSE 8080
