# ----- Build Stage -----
FROM node:18 AS builder
WORKDIR /app
# package.json と package-lock.json（または yarn.lock）をコピーして依存関係をインストール
COPY package*.json ./
RUN npm ci
# ソースコード全体をコピーしてビルド
COPY . .
RUN npm run build

# ----- Production Stage -----
FROM node:18-alpine AS runner
WORKDIR /app
# ビルド済みの成果物をコピー
COPY --from=builder /app ./
# Cloud Run は環境変数 PORT=8080 を利用するので、Next.js の起動コマンドもそれに合わせる
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
