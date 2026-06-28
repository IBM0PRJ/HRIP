FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml README.md /app/
COPY shared /app/shared
COPY services /app/services
COPY data /app/data
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -e /app
CMD ["uvicorn", "services.detection.app.main:app", "--host", "0.0.0.0", "--port", "8003"]

