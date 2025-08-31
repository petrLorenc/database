FROM python:3.13-slim

WORKDIR /app

# Install UV for package management
RUN pip install --no-cache-dir uv

# Copy pyproject.toml for dependency installation
COPY pyproject.toml .
COPY uv.lock .

# Install dependencies with UV
RUN uv sync --group mock-openai --group mock-server --frozen --no-managed-python

COPY backend /app
ENV PYTHONPATH=/app/functions
EXPOSE 5000

CMD ["uv", "run", "flask", "run", "--host=0.0.0.0", "--port=5000"]