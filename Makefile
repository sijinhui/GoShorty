.PHONY: help build run test clean migrate-up migrate-down migrate-create docker-build docker-run frontend-install frontend-build frontend-dev build-all clean-all

help:
	@echo "GoShorty Makefile Commands:"
	@echo "  make build              - Build the backend"
	@echo "  make run                - Run the application"
	@echo "  make test               - Run tests"
	@echo "  make clean              - Clean build artifacts"
	@echo "  make migrate-up         - Run database migrations"
	@echo "  make migrate-down       - Rollback database migrations"
	@echo "  make deps               - Download dependencies"
	@echo "  make dev                - Run backend in development mode"
	@echo "  make frontend-install   - Install frontend dependencies"
	@echo "  make frontend-build     - Build frontend"
	@echo "  make frontend-dev       - Run frontend dev server"
	@echo "  make build-all          - Build frontend and backend"
	@echo "  make clean-all          - Clean all build artifacts"

build:
	@echo "Building GoShorty..."
	go build -o bin/goshorty cmd/server/main.go

run: build
	@echo "Running GoShorty..."
	./bin/goshorty

dev:
	@echo "Running in development mode..."
	go run cmd/server/main.go

test:
	@echo "Running tests..."
	go test -v ./...

clean:
	@echo "Cleaning..."
	rm -rf bin/
	go clean

deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

migrate-up:
	@echo "Running migrations..."
	psql -h $(DB_HOST) -U $(DB_USER) -d $(DB_NAME) -f internal/database/migrations/001_initial_schema.sql

migrate-down:
	@echo "Rolling back migrations..."
	@echo "Manual rollback required"

docker-build:
	@echo "Building Docker image..."
	docker build -t goshorty:latest .

docker-run:
	@echo "Running Docker container..."
	docker-compose up -d

# 前端相关命令
frontend-install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

frontend-build:
	@echo "Building frontend..."
	cd frontend && npm run build

frontend-dev:
	@echo "Starting frontend dev server..."
	cd frontend && npm run dev

# 完整构建
build-all: frontend-build build
	@echo "Build complete!"

# 清理所有
clean-all: clean
	@echo "Cleaning frontend..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules
