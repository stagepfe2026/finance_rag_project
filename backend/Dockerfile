FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Preload the cross-encoder reranker so the runtime container can run with
# HF_HUB_OFFLINE=1 and still keep the full reranking quality.
ARG RERANKER_MODEL_NAME=cross-encoder/mmarco-mMiniLMv2-L12-H384-v1
RUN python -c "from sentence_transformers import CrossEncoder; CrossEncoder('${RERANKER_MODEL_NAME}')"

COPY app ./app
COPY storage ./storage

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
