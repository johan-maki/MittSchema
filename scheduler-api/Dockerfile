# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Copy dependency file and install packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose the correct Cloud Run port
EXPOSE 8080

# Start FastAPI with Uvicorn
CMD ["uvicorn", "scheduler:app", "--host", "0.0.0.0", "--port", "8080"]
