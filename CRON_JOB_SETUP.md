# Configuración del Cron Job para Métricas Diarias

## Requisitos Previos

1. **Archivo .env configurado**: Asegúrate de tener un archivo `.env` en la raíz del proyecto con las variables necesarias:
   ```
   SUPABASE_URL=tu_url_de_supabase
   SUPABASE_SERVICE_KEY=tu_service_key_de_supabase
   ```

2. **Python instalado**: El script requiere Python 3.7+

## Configuración en Windows (Programador de Tareas)

### Opción 1: Usando PowerShell Script (Recomendado)

1. **Abrir el Programador de tareas**:
   - Presiona `Win + R`
   - Escribe `taskschd.msc`
   - Presiona Enter

2. **Crear nueva tarea**:
   - En el panel derecho, haz clic en "Crear tarea básica"
   - Nombre: `Daily Metrics Calculator`
   - Descripción: `Ejecuta el cálculo de métricas diarias para el panel de administración`

3. **Configurar trigger**:
   - Selecciona "Diariamente"
   - Hora de inicio: `02:00:00` (2:00 AM)
   - Repetir cada: `1 día`

4. **Configurar acción**:
   - Selecciona "Iniciar un programa"
   - Programa/script: `powershell.exe`
   - Argumentos: `-ExecutionPolicy Bypass -File "C:\ruta\completa\a\tu\proyecto\run_daily_metrics.ps1"`

5. **Configuración adicional**:
   - Marca "Abrir las propiedades avanzadas para esta tarea cuando haga clic en Finalizar"
   - En la pestaña "General":
     - Marca "Ejecutar con los privilegios más altos"
     - Configura para "Ejecutar independientemente de si el usuario ha iniciado sesión"
   - En la pestaña "Condiciones":
     - Desmarca "Iniciar la tarea solo si el equipo está conectado a CA"
   - En la pestaña "Configuración":
     - Marca "Permitir que la tarea se ejecute a petición"
     - Marca "Ejecutar la tarea lo antes posible si se omite una ejecución programada"

### Opción 2: Usando Batch Script

1. **Crear nueva tarea** como en la Opción 1
2. **Configurar acción**:
   - Programa/script: `C:\ruta\completa\a\tu\proyecto\run_daily_metrics.bat`

## Configuración en Linux/Mac (Cron tradicional)

1. **Abrir crontab**:
   ```bash
   crontab -e
   ```

2. **Agregar la línea**:
   ```bash
   0 2 * * * cd /ruta/completa/a/tu/proyecto/server && python scripts/daily_metrics_calculator.py >> /var/log/daily_metrics.log 2>&1
   ```

## Verificación

### Probar manualmente:
```bash
# En Windows (PowerShell)
.\run_daily_metrics.ps1

# En Linux/Mac
cd server && python scripts/daily_metrics_calculator.py
```

### Verificar logs:
- **Windows**: `C:\logs\daily_metrics.log`
- **Linux/Mac**: `/var/log/daily_metrics.log`
- **Script**: `server/daily_metrics.log`

## Solución de Problemas

### Error: Variables de entorno no encontradas
- Verifica que el archivo `.env` existe y tiene los valores correctos
- Asegúrate de que `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` están configurados

### Error: Python no encontrado
- Verifica que Python está instalado y en el PATH
- Usa la ruta completa a Python si es necesario

### Error: Permisos
- En Windows, ejecuta el Programador de tareas como administrador
- En Linux, verifica permisos de escritura en el directorio de logs

### Error: Base de datos
- Verifica que las tablas de analytics están creadas
- Ejecuta los scripts SQL de configuración si es necesario

## Monitoreo

El script genera logs detallados que incluyen:
- Fecha y hora de ejecución
- Estado de cada paso del proceso
- Errores si ocurren
- Métricas calculadas

## Notas Importantes

1. **Hora de ejecución**: Se recomienda ejecutar a las 2:00 AM para evitar conflictos con el uso normal del sistema
2. **Logs**: Los logs se guardan automáticamente para facilitar el debugging
3. **Fallback**: Si el cron job falla, siempre puedes usar el botón "Actualizar Métricas" en el panel de administración
4. **Backup**: El script es idempotente, puede ejecutarse múltiples veces sin problemas 