FROM python:3.13-slim

WORKDIR /app

# Install system build dependencies for numerical and quantum packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend package and data snapshots
COPY qportfolio ./qportfolio
COPY data ./data

ENV PYTHONUNBUFFERED=1
ENV PYTHONUTF8=1
ENV PORT=8000
ENV CORS_ORIGINS="*"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn qportfolio.api.main:app --host 0.0.0.0 --port ${PORT}"]
