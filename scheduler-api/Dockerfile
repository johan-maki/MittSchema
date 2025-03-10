# Use official Python slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy dependencies
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure correct port is used (Cloud Run assigns it dynamically)
EXPOSE 8080

# Start FastAPI with Uvicorn and ensure Cloud Run can access it
CMD ["uvicorn", "scheduler:app", "--host", "0.0.0.0", "--port", "8080"]
