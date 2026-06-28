up:
	docker compose up --build

down:
	docker compose down -v

bootstrap:
	python scripts/bootstrap_demo.py

smoke:
	python scripts/smoke_ingest.py

test:
	pytest

lint:
	ruff check .
