# Kalid Nur's site. Small Node image; only production dependencies; runs as a non-root user.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production PORT=8080

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server ./server
COPY public ./public
COPY content ./content

# Ask's monthly spend total lives here (the only file the app writes).
RUN mkdir -p /app/data && chown node:node /app/data
USER node

EXPOSE 8080
CMD ["node", "server/index.js"]
