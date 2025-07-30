# Configuración de la Tabla Users

## 🚀 Instrucciones Simples

### 1. Ejecutar el Script Corregido
- Ve a tu proyecto de Supabase
- Navega a **SQL Editor**
- Copia y pega el contenido del archivo `setup_users_table.sql`
- Ejecuta el script completo

### 2. Verificar que Funcionó
- El script mostrará: `✅ Tabla users configurada correctamente`
- También mostrará cuántos usuarios existentes fueron migrados
- Mostrará estadísticas de usuarios en auth.users vs public.users

### 3. Probar la Funcionalidad
- Registra un nuevo usuario en tu aplicación
- Verifica que se crea automáticamente el perfil en la tabla `users`
- Los usuarios existentes también tendrán perfiles creados automáticamente

## 🔧 Fix para Error 500

### Problema:
- Error 500 al crear nuevos usuarios
- El trigger fallaba al convertir UUID a bigint
- Errores en la función `handle_new_user`

### Solución:
- ✅ **Función de conversión mejorada**: Maneja overflow y errores
- ✅ **Trigger más robusto**: No falla si hay errores de conversión
- ✅ **Manejo de excepciones**: Continúa funcionando aunque haya errores
- ✅ **Verificación de duplicados**: Evita crear perfiles duplicados

## 📋 Lo que hace el script corregido:

✅ **Crea la tabla `users`** con todos los campos necesarios para una tienda virtual  
✅ **Migra usuarios existentes** automáticamente desde `auth.users` a `public.users`  
✅ **Configura triggers robustos** para crear perfiles automáticamente para nuevos usuarios  
✅ **Maneja la conversión** de UUID a bigint de forma segura  
✅ **Configura políticas de seguridad** (RLS)  
✅ **Crea índices** para mejor rendimiento  
✅ **Maneja errores** sin fallar el registro de usuarios  

## 🔧 Funcionalidades especiales:

### Para usuarios existentes:
- **Migración automática**: Todos los usuarios que ya existen en `auth.users` tendrán perfiles creados automáticamente
- **Creación bajo demanda**: Si un usuario existente intenta acceder y no tiene perfil, se crea automáticamente
- **Sin pérdida de datos**: Los usuarios existentes no perderán acceso a la aplicación

### Para nuevos usuarios:
- **Creación automática**: Cada nuevo registro crea automáticamente un perfil en `public.users`
- **Triggers automáticos**: Los perfiles se crean sin intervención manual
- **Manejo de errores**: Si falla la conversión, el usuario se registra igual

## 🔧 Campos incluidos:

- **Información básica**: id, email, first_name, last_name, phone
- **Dirección**: address, city, state, postal_code, country
- **Tienda virtual**: wishlist, cart_items, order_history, total_spent, loyalty_points
- **Preferencias**: preferences, shipping_preferences, favorite_categories
- **Marketing**: newsletter_subscription, marketing_consent
- **Sistema**: role, is_active, created_at, updated_at, last_login, login_count

## 🎯 Listo para usar

Una vez ejecutado el script:
- ✅ Todos los usuarios existentes tendrán perfiles creados automáticamente
- ✅ Los nuevos usuarios tendrán perfiles creados al registrarse
- ✅ Los usuarios que accedan sin perfil lo tendrán creado automáticamente
- ✅ Tu aplicación seguirá funcionando sin interrupciones
- ✅ **No más errores 500** al crear usuarios

## 🔄 Migración segura

El script está diseñado para ser **seguro y no destructivo**:
- No elimina datos existentes
- Crea perfiles solo para usuarios que no los tienen
- Mantiene la funcionalidad existente de tu aplicación
- Es compatible con usuarios antiguos y nuevos
- **Maneja errores graciosamente** sin fallar el registro

## 🧪 Script de prueba

Después de ejecutar el script principal, puedes ejecutar `test_fix.sql` para verificar que todo funciona correctamente.