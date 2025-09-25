# Guía del Super Administrador - Calle Jerusalén Community

## Acceso del Super Administrador

**Email por defecto:** `mar90jesus@gmail.com`  
**Contraseña por defecto:** `Admin123!@#`  
**Rol:** `super_admin`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión por seguridad.

## Inicialización del Sistema

Para crear el super administrador por defecto, ejecuta:

```bash
npm run init-admin
```

Este comando:
- Crea el usuario en Firebase Authentication
- Establece el rol de `super_admin` en Firestore
- Asigna permisos completos del sistema
- Registra la acción en los logs del sistema

## Funcionalidades del Super Administrador

### 🎛️ Panel de Administración

Acceso completo al dashboard de administración en `/admin` con las siguientes secciones:

#### 📊 Resumen (Overview)
- Estadísticas en tiempo real del sistema
- Métricas de usuarios (totales, activos, por rol)
- Solicitudes pendientes
- Actividad reciente del sistema
- Gráficos de uso

#### 👥 Gestión de Usuarios
- **Ver todos los usuarios** del sistema
- **Crear nuevos usuarios** con cualquier rol
- **Editar información** de usuarios existentes
- **Cambiar roles** de usuarios
- **Activar/desactivar** usuarios
- **Eliminar usuarios** del sistema
- **Ver último acceso** de cada usuario

#### ⏰ Solicitudes de Registro
- **Aprobar solicitudes** de nuevos residentes
- **Rechazar solicitudes** con motivo
- **Cambiar rol asignado** durante la aprobación
- **Ver historial** de solicitudes procesadas

#### 🔒 Seguridad
- **Monitoreo de cámaras** de seguridad
- **Alertas de pánico** en tiempo real
- **Logs de acceso** a funciones sensibles
- **Estadísticas de seguridad**

#### 📋 Logs del Sistema
- **Registro completo** de todas las acciones
- **Filtros por fecha** y tipo de acción
- **Detalles de cada operación** realizada
- **Auditoría completa** del sistema

#### ⚙️ Configuración del Sistema
- **Configuración general** de la aplicación
- **Permisos del sistema**
- **Configuración de notificaciones**
- **Configuración de seguridad**

### 🔐 Permisos Especiales

El super administrador tiene acceso a:

1. **Todas las funciones de residente:**
   - Cámaras de seguridad
   - Botón de pánico
   - Alertas comunitarias
   - Reportes de seguridad

2. **Todas las funciones de visitante:**
   - Explorar lugares
   - Ver servicios
   - Mapa interactivo
   - Eventos comunitarios

3. **Funciones exclusivas de super admin:**
   - Gestión completa de usuarios
   - Aprobar/rechazar registros
   - Ver logs del sistema
   - Configuración del sistema
   - Métricas y estadísticas
   - Crear otros super administradores

## Gestión de Usuarios

### Crear Usuario

1. Ir a **Usuarios** → **Crear Usuario**
2. Completar formulario:
   - Nombre completo
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Rol asignado
3. El usuario se crea automáticamente y se registra en los logs

### Editar Usuario

1. En la tabla de usuarios, hacer clic en el ícono de **editar**
2. Modificar información permitida:
   - Nombre completo
   - Rol del usuario
   - Estado activo/inactivo
3. Los cambios se registran automáticamente

### Eliminar Usuario

1. En la tabla de usuarios, hacer clic en el ícono de **eliminar**
2. Confirmar la acción
3. El usuario se elimina del sistema y se registra en los logs

⚠️ **No se puede eliminar el propio usuario super administrador**

## Gestión de Solicitudes de Registro

### Aprobar Solicitud

1. Ir a **Solicitudes** → Ver solicitudes pendientes
2. Hacer clic en **Aprobar**
3. Se puede cambiar el rol asignado si es necesario
4. La solicitud se marca como aprobada

### Rechazar Solicitud

1. Hacer clic en **Rechazar**
2. Proporcionar motivo del rechazo
3. La solicitud se marca como rechazada con el motivo

## Logs del Sistema

Todos los logs incluyen:
- **Acción realizada**
- **Usuario que realizó la acción**
- **Fecha y hora exacta**
- **Detalles específicos** de la operación

### Tipos de Logs Registrados

- `user_created` - Usuario creado
- `user_updated` - Usuario actualizado
- `user_deleted` - Usuario eliminado
- `registration_approved` - Registro aprobado
- `registration_rejected` - Registro rechazado
- `role_changed` - Rol cambiado
- `user_activated` - Usuario activado
- `user_deactivated` - Usuario desactivado

## Métricas del Sistema

### Estadísticas Disponibles

- **Usuarios totales** registrados
- **Usuarios activos** actualmente
- **Distribución por roles**
- **Acciones realizadas hoy**
- **Solicitudes pendientes**
- **Actividad reciente**

### Actualización de Datos

Los datos se actualizan automáticamente cada vez que se accede al dashboard.

## Seguridad

### Medidas Implementadas

1. **Verificación de roles** en todas las operaciones
2. **Logs completos** de todas las acciones
3. **Reglas de Firestore** que protegen datos sensibles
4. **Autenticación requerida** para todas las funciones
5. **Validación de permisos** en el frontend y backend

### Acceso Restringido

- Solo usuarios con rol `super_admin` pueden acceder al panel
- Las reglas de Firestore validan permisos en cada operación
- Los logs registran todos los intentos de acceso

## Troubleshooting

### Problemas Comunes

1. **No puedo acceder al panel de administración**
   - Verificar que el email sea exactamente `mar90jesus@gmail.com`
   - Verificar que el rol en Firestore sea `super_admin`
   - Verificar que el usuario esté activo

2. **No aparecen usuarios en la tabla**
   - Verificar conexión a Firebase
   - Verificar reglas de Firestore
   - Revisar logs de la consola del navegador

3. **Error al crear usuario**
   - Verificar que el email no esté ya registrado
   - Verificar que la contraseña tenga al menos 6 caracteres
   - Verificar permisos de Firebase Auth

4. **Logs no se actualizan**
   - Verificar conexión a Firebase
   - Verificar reglas de Firestore para la colección `systemLogs`
   - Recargar la página

### Comandos de Diagnóstico

```bash
# Verificar configuración de Firebase
npm run dev

# Verificar logs en la consola del navegador
# Ir a Developer Tools → Console

# Verificar datos en Firestore
# Ir a Firebase Console → Firestore Database
```

## Contacto y Soporte

Para problemas técnicos o dudas sobre el sistema:

- **Email del desarrollador:** [email del desarrollador]
- **Documentación técnica:** Ver archivos README.md, ROLES_SYSTEM.md
- **Logs del sistema:** Revisar sección de Logs en el panel de administración

---

**Última actualización:** $(date)  
**Versión del sistema:** 1.0.0
