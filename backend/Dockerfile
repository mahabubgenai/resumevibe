FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Copy app
COPY . .

# Create chroma_db directory
RUN mkdir -p app/ml/chroma_db

# Port
EXPOSE 7860

# Start
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]