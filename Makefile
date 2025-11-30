# Makefile for common dev tasks

.PHONY: dev test lint migrate db-push prisma-generate install

dev:
	npm run dev

test:
	npm test

lint:
	npm run lint

migrate:
	npm run migrate:dev

db-push:
	npm run db:push

prisma-generate:
	npm run prisma:generate

install:
	npm install
