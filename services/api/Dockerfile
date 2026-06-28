FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml README.md /app/
COPY shared /app/shared
COPY services /app/services
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -e /app
CMD ["uvicorn", "services.api.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

