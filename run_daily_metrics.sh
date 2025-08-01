#!/bin/bash

# Script para ejecutar el cálculo de métricas diarias en el servidor
# Este script puede ser ejecutado por cron

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
LOG_DIR="/var/log"
LOG_FILE="$LOG_DIR/daily_metrics.log"
PYTHON_SCRIPT="$SERVER_DIR/scripts/daily_metrics_calculator.py"

# Función para escribir logs
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

log_message "=== INICIANDO CÁLCULO DE MÉTRICAS DIARIAS ==="

# Verificar que el script existe
if [ ! -f "$PYTHON_SCRIPT" ]; then
    log_message "ERROR: No se encontró el script en $PYTHON_SCRIPT"
    exit 1
fi

# Verificar que Python está disponible
if ! command -v python3 &> /dev/null; then
    log_message "ERROR: Python3 no está instalado o no está en el PATH"
    exit 1
fi

# Cambiar al directorio del servidor
cd "$SERVER_DIR" || {
    log_message "ERROR: No se pudo cambiar al directorio $SERVER_DIR"
    exit 1
}

log_message "Directorio de trabajo: $(pwd)"
log_message "Ejecutando script: $PYTHON_SCRIPT"

# Ejecutar el script de Python
if python3 "$PYTHON_SCRIPT" >> "$LOG_FILE" 2>&1; then
    log_message "Script ejecutado exitosamente"
else
    log_message "ERROR: El script falló con código de salida $?"
    exit 1
fi

log_message "=== CÁLCULO DE MÉTRICAS DIARIAS COMPLETADO ===" 