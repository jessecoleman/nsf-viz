FROM python:3.7.2

# Setup a spot for the api code
WORKDIR /usr/local/src/app/backend

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy over the source code
COPY . .

# Kick things off
ENTRYPOINT [ "python3" ]
CMD ["app.py", "--host", "0.0.0.0"]