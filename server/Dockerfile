# Usamos Python 3.9 slim para compatibilidad con tus paquetes
FROM python:3.9-slim

# Directorio de trabajo en el contenedor
WORKDIR /app

# Instalamos dependencias del sistema necesarias para compilar extensiones de Pillow y rembg
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiamos el archivo de dependencias
COPY requirements.txt .

# Instalamos las dependencias de Python sin cache para ahorrar espacio
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto de la aplicación
COPY . .

# Exponemos el puerto que usa Flask
EXPOSE 5000

# Variables de entorno para Flask
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV PORT=5000

# Comando para ejecutar la app
#CMD ["python", "run.py"]
CMD ["gunicorn", "--workers=4", "--bind", "0.0.0.0:5000", "run:app"]