# mirror.gcr.io — Docker Hub с сервера упирается в лимит анонимных скачиваний (429)
FROM mirror.gcr.io/library/python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 DATA_DIR=/app/data
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY core.py llm.py storage.py telegram_bot.py config.json ./
RUN useradd --uid 1001 --no-create-home bot && mkdir -p /app/data && chown bot /app/data
USER bot

CMD ["python", "telegram_bot.py"]
