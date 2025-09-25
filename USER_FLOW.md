# Flujo de Usuarios - Calle Jerusalén Community

## 📋 Resumen del Sistema de Usuarios

El sistema está diseñado para manejar diferentes tipos de usuarios con diferentes niveles de acceso, pero **solo los residentes de la comunidad pueden registrarse**.

## 🔄 Flujo de Usuarios

### 1. 👤 **Usuario Invitado** (Sin registro)
- **Acceso**: Automático al explorar la página
- **Funcionalidades**: 
  - Ver lugares de recreación
  - Ver servicios locales
  - Acceder al mapa interactivo
  - Contactar a la comunidad
- **No puede**: Acceder a funciones de seguridad

### 2. 👁️ **Visitante** (Sin registro)
- **Acceso**: Automático al explorar con más detalle
- **Funcionalidades**:
  - Todas las funciones del invitado
  - Información detallada de lugares
  - Participar en eventos comunitarios
  - Recibir notificaciones
- **No puede**: Acceder a cámaras de seguridad ni botón de pánico
- **Importante**: Los visitantes **NO se registran**, solo exploran

### 3. 🛡️ **Residente** (Requiere registro y aprobación)
- **Acceso**: Requiere registro y verificación por super administrador
- **Funcionalidades**:
  - Todas las funciones del visitante
  - Cámaras de seguridad
  - Botón de pánico
  - Alertas comunitarias
  - Reportes de seguridad
- **Proceso de registro**:
  1. Usuario se registra en `/register`
  2. Super administrador recibe notificación
  3. Super administrador aprueba/rechaza en panel `/admin`
  4. Usuario recibe acceso completo

### 4. 👑 **Super Administrador** (Acceso especial)
- **Acceso**: Cuenta especial con permisos completos
- **Funcionalidades**: Todas las funciones + panel de administración
- **Creación**: Solo a través de scripts o por otro super admin

## 🚫 **Usuarios que NO se Registran**

### Visitantes
- Los visitantes **NO se registran** en el sistema
- Solo exploran la comunidad sin crear cuentas
- Su acceso es temporal y sin persistencia

### Invitados
- Los invitados **NO se registran** en el sistema
- Solo navegan por la información pública
- Su acceso es temporal y limitado

## ✅ **Usuarios que SÍ se Registran**

### Solo Residentes
- Únicamente los **residentes de la comunidad** pueden registrarse
- Deben ser verificados por un super administrador
- Su registro les da acceso completo a las funcionalidades

## 📝 **Proceso de Registro**

### Para Residentes:
1. **Registro inicial**: Usuario completa formulario en `/register`
2. **Verificación**: Super administrador revisa la solicitud
3. **Aprobación**: Super admin aprueba o rechaza en `/admin`
4. **Acceso**: Usuario recibe acceso completo a funciones de residente

### Para Super Administradores:
1. **Creación inicial**: Script `npm run init-admin`
2. **Gestión**: Otros super admins pueden crear más super admins
3. **Acceso**: Acceso inmediato a todas las funciones

## 🔐 **Seguridad del Sistema**

### Validaciones Implementadas:
- ✅ Solo residentes pueden registrarse
- ✅ Visitantes no pueden crear cuentas
- ✅ Super admins deben aprobar nuevos residentes
- ✅ Logs completos de todas las acciones
- ✅ Verificación de roles en todas las operaciones

### Reglas de Firestore:
- ✅ Solo usuarios autenticados pueden acceder a datos
- ✅ Solo residentes pueden crear reportes de pánico
- ✅ Solo super admins pueden gestionar usuarios
- ✅ Solo super admins pueden acceder a logs del sistema

## 🎯 **Casos de Uso**

### Escenario 1: Persona que quiere explorar
- **Acción**: Navega como invitado/visitante
- **Resultado**: Acceso limitado sin registro

### Escenario 2: Residente de la comunidad
- **Acción**: Se registra en `/register`
- **Resultado**: Solicitud pendiente de aprobación
- **Siguiente**: Super admin aprueba en `/admin`

### Escenario 3: Super administrador
- **Acción**: Gestiona usuarios en `/admin`
- **Resultado**: Puede aprobar/rechazar residentes
- **Acceso**: Todas las funcionalidades del sistema

## 📊 **Estadísticas del Sistema**

El panel de administración muestra:
- Usuarios totales registrados (solo residentes y super admins)
- Solicitudes pendientes de aprobación
- Actividad reciente del sistema
- Logs de todas las acciones

## 🔧 **Configuración Técnica**

### Archivos Clave:
- `app/register/page.tsx` - Solo permite registro de residentes
- `lib/auth.ts` - Funciones de autenticación
- `app/admin/page.tsx` - Panel de gestión de usuarios
- `firestore.rules` - Reglas de seguridad

### Scripts Disponibles:
- `npm run init-admin` - Crear super administrador inicial
- `npm run update-admin` - Actualizar usuario existente a super admin

---

**Resumen**: Solo los residentes de la comunidad pueden registrarse. Los visitantes exploran sin registro. El super administrador gestiona todas las aprobaciones.
