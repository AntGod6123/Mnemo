FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    pyzim \
    python-multipart \
    argostranslate \
    sqlite-utils \
    python-jose[cryptography] \
    bcrypt \
    aiofiles \
    requests \
    PyMuPDF \
    python-dotenv

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
