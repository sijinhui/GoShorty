# 构建阶段
FROM golang:1.25-alpine AS builder

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

# 从构建阶段复制二进制文件
COPY --from=builder /app/goshorty .
COPY --from=builder /app/web ./web

# 暴露端口
EXPOSE 8800

# 运行应用
CMD ["./goshorty"]
