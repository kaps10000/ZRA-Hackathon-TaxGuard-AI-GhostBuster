FROM python:3.11-slim
WORKDIR /app
COPY predictive/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY predictive /app/predictive
EXPOSE 8001
CMD ["uvicorn", "predictive.app.main:app", "--host", "0.0.0.0", "--port", "8001"]
