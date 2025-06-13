FROM python:3.11-slim

WORKDIR /app

COPY . /app

# wkhtmltopdf is required for PDF generation
RUN apt-get update && apt-get install -y wkhtmltopdf && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    libzim \
    python-multipart \
    argostranslate \
    langdetect \
    sqlite-utils \
    python-jose[cryptography] \
    bcrypt \
    aiofiles \
    requests \
    PyMuPDF \
    pdfkit \
    python-dotenv \
    itsdangerous

# Translation packages are installed on demand via the admin UI

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
