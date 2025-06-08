FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    pyzim \
    python-multipart \
    argostranslate \
    langdetect \
    sqlite-utils \
    python-jose[cryptography] \
    bcrypt \
    aiofiles \
    requests \
    PyMuPDF \
    python-dotenv

# Preload common Argos Translate packages
RUN python - <<'EOF'
import argostranslate.package as pkg
pkgs = [p for p in pkg.get_available_packages() if p.from_code in ("en", "es", "fr") or p.to_code in ("en", "es", "fr")]
for p in pkgs:
    path = pkg.download_package(p)
    pkg.install_from_path(path)
EOF

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
