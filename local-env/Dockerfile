FROM python:3.13-slim

WORKDIR /app

# Install UV for package management
RUN pip install --no-cache-dir uv

# Copy pyproject.toml for dependency installation
COPY pyproject.toml .
COPY uv.lock .

# Install dependencies with UV
RUN uv venv .venv --no-managed-python
RUN uv sync --group mock-openai --group mock-server --frozen --no-managed-python

COPY local-dev/mock-openai /app
EXPOSE 8080

CMD ["uv", "run", "python", "app.py"]