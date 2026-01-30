.PHONY: help build run test clean migrate-up migrate-down migrate-create docker-build docker-run

help:
	@echo "GoShorty Makefile Commands:"
	@echo "  make build         - Build the application"
	@echo "  make run           - Run the application"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make migrate-up    - Run database migrations"
	@echo "  make migrate-down  - Rollback database migrations"
	@echo "  make deps          - Download dependencies"
	@echo "  make dev           - Run in development mode"

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
