# 前端构建阶段
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装依赖
RUN npm ci

# 复制前端源代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# 后端构建阶段
FROM golang:1.25-alpine AS backend-builder

WORKDIR /app

# 安装依赖
RUN apk add --no-cache git make

# 复制go mod文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 编译应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o goshorty ./cmd/server

# 运行阶段
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# 从后端构建阶段复制二进制文件
COPY --from=backend-builder /app/goshorty .

# 从前端构建阶段复制静态文件
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 暴露端口
EXPOSE 8800

# 运行应用
CMD ["./goshorty"]
