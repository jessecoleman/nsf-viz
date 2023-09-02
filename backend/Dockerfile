FROM python:3.8

# Setup a spot for the api code
WORKDIR /usr/local/src/app/backend

RUN pip install poetry

COPY poetry.lock .
COPY pyproject.toml .

# Project initialization:
RUN poetry config virtualenvs.create false \
  && poetry install --no-interaction --no-ansi

# Copy over the source code
COPY . .

# Kick things off
ENTRYPOINT [ "poetry" ]
CMD ["run", "python", "app.py", "--host", "0.0.0.0"]