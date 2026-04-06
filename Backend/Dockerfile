# Base image
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Prevent .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . .

# Collect static files (optional)
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Run server (use gunicorn for production)
CMD ["gunicorn", "backend_core.wsgi:application", "--bind", "0.0.0.0:8000"]