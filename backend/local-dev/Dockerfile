FROM python:3.13-slim

WORKDIR /app

# Install UV for package management
RUN pip install --no-cache-dir uv

# Copy pyproject.toml for dependency installation
COPY pyproject.toml .
COPY uv.lock .

# Install dependencies with UV
RUN uv sync --group mock-openai --group mock-server --frozen --no-managed-python

# Note: backend files will be mounted as a volume
ENV PYTHONPATH=/app/backend/functions
ENV FLASK_ENV=development
ENV FLASK_DEBUG=1
EXPOSE 5000

CMD ["uv", "run", "--no-sync", "flask", "--app", "/app/backend/local-dev/app.py", "run", "--host=0.0.0.0", "--port=5000", "--reload", "--debug"]