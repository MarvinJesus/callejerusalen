# Guía de Permisos de Administración - Calle Jerusalén

## Resumen

Este documento describe los permisos requeridos para acceder a cada página del panel de administración. El sistema de permisos garantiza que los usuarios solo puedan acceder a las funcionalidades para las que tienen autorización.

## Super Admin

El **Super Admin** tiene acceso completo a todas las páginas y funcionalidades sin restricciones. No necesita permisos específicos adicionales.

## Estructura de Permisos por Página

### 1. Páginas Principales

#### `/admin` y `/admin/admin-dashboard`
- **Roles permitidos:** `admin`, `super_admin`
- **Permisos requeridos (cualquiera):**
  - `users.view` - Ver usuarios
  - `registrations.view` - Ver solicitudes de registro
  - `permissions.view` - Ver permisos
  - `community.view` - Ver información de la comunidad
  - `community.events` - Gestionar eventos
  - `community.places` - Gestionar lugares
  - `community.services` - Gestionar servicios
  - `security.view` - Ver información de seguridad

#### `/admin/permissions`
- **Roles permitidos:** `admin`, `super_admin`
- **Permiso requerido:**
  - `permissions.assign` - Asignar permisos a usuarios

### 2. Seguridad y Emergencias

#### `/admin/emergency`
- **Roles permitidos:** `admin`, `super_admin`
- **Permisos requeridos (cualquiera):**
  - `security.view` - Ver información de seguridad
  - `security.alerts` - Gestionar alertas de seguridad

### 3. Gestión de Contenido Histórico

#### `/admin/history`
- **Roles permitidos:** `admin`, `super_admin`
- **Permisos requeridos (cualquiera):**
  - `community.view` - Ver información de la comunidad
  - `community.edit` - Editar información de la comunidad

#### Subpáginas de Historia:
Todas heredan los mismos permisos de la página principal:
- `/admin/history/periods` - Gestionar períodos históricos
- `/admin/history/traditions` - Gestionar tradiciones culturales
- `/admin/history/events` - Gestionar eventos históricos
- `/admin/history/places` - Gestionar lugares históricos
- `/admin/history/gallery` - Gestionar galería histórica
- `/admin/history/guide` - Gestionar guía de visitantes
- `/admin/history/services` - Gestionar servicios locales

### 4. Gestión de Lugares

#### `/admin/places`
- **Roles permitidos:** `admin`, `super_admin`
- **Permisos requeridos (cualquiera):**
  - `community.places` - Gestionar lugares
  - `community.edit` - Editar información de la comunidad

#### `/admin/places/new` y `/admin/places/[id]/edit`
- **Roles permitidos:** `admin`, `super_admin`
- **Permisos requeridos (cualquiera):**
  - `community.places` - Gestionar lugares
  - `community.edit` - Editar información de la comunidad

### 5. Gestión de Servicios

#### `/admin/services`
- **Roles permitidos:** `admin`, `super_admin`
- **Permisos requeridos (cualquiera):**
  - `community.services` - Gestionar servicios
  - `community.edit` - Editar información de la comunidad

## Comportamiento de Verificación de Permisos

### Super Admin
- El Super Admin **siempre** tiene acceso a todas las páginas
- No se le aplican restricciones de permisos
- Puede realizar cualquier acción en el sistema

### Admin Regular
- Necesita tener **al menos uno** de los permisos listados para cada página
- Si no tiene ninguno de los permisos requeridos, será redirigido
- Los permisos son asignados por el Super Admin desde `/admin/permissions`

## Permisos Disponibles

### Gestión de Usuarios
- `users.view` - Ver lista de usuarios y sus perfiles
- `users.create` - Crear nuevos usuarios en el sistema
- `users.edit` - Editar información de usuarios existentes
- `users.delete` - Eliminar usuarios del sistema
- `users.activate` - Activar usuarios inactivos
- `users.deactivate` - Desactivar usuarios activos

### Gestión de Roles y Permisos
- `roles.view` - Ver roles disponibles en el sistema
- `roles.assign` - Asignar roles a usuarios
- `permissions.view` - Ver permisos disponibles y asignados
- `permissions.assign` - Asignar permisos específicos a usuarios

### Gestión de Solicitudes
- `registrations.view` - Ver solicitudes de registro pendientes
- `registrations.approve` - Aprobar solicitudes de registro
- `registrations.reject` - Rechazar solicitudes de registro

### Sistema y Configuración
- `system.view` - Ver configuración del sistema
- `system.configure` - Modificar configuración del sistema
- `system.backup` - Crear copias de seguridad del sistema
- `system.restore` - Restaurar desde copias de seguridad

### Seguridad y Monitoreo
- `security.view` - Ver panel de seguridad
- `security.monitor` - Monitorear actividad de seguridad
- `security.alerts` - Gestionar alertas de seguridad
- `security.cameras` - Acceder a cámaras de seguridad

### Reportes y Analytics
- `reports.view` - Ver reportes del sistema
- `reports.export` - Exportar reportes
- `analytics.view` - Ver analytics y estadísticas
- `analytics.export` - Exportar datos de analytics

### Logs del Sistema
- `logs.view` - Ver logs del sistema
- `logs.export` - Exportar logs del sistema
- `logs.delete` - Eliminar logs del sistema

### Configuración de la Comunidad
- `community.view` - Ver configuración de la comunidad
- `community.edit` - Editar configuración de la comunidad
- `community.events` - Gestionar eventos comunitarios
- `community.services` - Gestionar servicios comunitarios
- `community.places` - Gestionar lugares de la comunidad

## Flujo de Verificación

1. **Usuario intenta acceder a una página de admin**
2. **Sistema verifica autenticación:**
   - Si no está autenticado → Redirige a `/login`
3. **Sistema verifica rol:**
   - Si es `super_admin` → Acceso permitido ✅
   - Si es `admin` → Continúa a verificación de permisos
   - Si es otro rol → Acceso denegado ❌
4. **Sistema verifica permisos (solo para admin):**
   - Si tiene al menos uno de los permisos requeridos → Acceso permitido ✅
   - Si no tiene ninguno → Acceso denegado ❌

## Ejemplos de Configuración

### Admin de Solo Lectura
```typescript
const permissions = [
  'users.view',
  'registrations.view',
  'security.view',
  'reports.view',
  'analytics.view',
  'logs.view',
  'community.view'
];
```
**Acceso a:**
- ✅ Dashboard principal
- ✅ Ver usuarios (sin editar)
- ✅ Ver solicitudes (sin aprobar/rechazar)
- ❌ Gestión de permisos
- ❌ Emergencias (sin permisos de seguridad activos)

### Admin de Gestión de Contenido
```typescript
const permissions = [
  'community.view',
  'community.edit',
  'community.events',
  'community.services',
  'community.places'
];
```
**Acceso a:**
- ✅ Dashboard principal
- ✅ Gestión de historia completa
- ✅ Gestión de lugares completa
- ✅ Gestión de servicios completa
- ❌ Gestión de permisos
- ❌ Emergencias

### Admin de Seguridad
```typescript
const permissions = [
  'security.view',
  'security.monitor',
  'security.alerts',
  'logs.view',
  'reports.view'
];
```
**Acceso a:**
- ✅ Dashboard principal
- ✅ Emergencias
- ✅ Ver logs
- ✅ Ver reportes
- ❌ Gestión de permisos
- ❌ Gestión de contenido

## Notas Importantes

1. **requireAllPermissions=false:** Las páginas están configuradas para requerir **al menos uno** de los permisos listados, no todos.

2. **Super Admin siempre tiene acceso:** El Super Admin puede acceder a cualquier página sin restricciones.

3. **Redirección automática:** Si un usuario no tiene permisos, es redirigido automáticamente a la página principal (`/`).

4. **Mensajes de error:** Los usuarios reciben notificaciones toast explicando por qué no tienen acceso.

5. **Verificación en cliente y servidor:** La verificación de permisos se realiza tanto en el cliente (componente ProtectedRoute) como en las APIs.

## Próximos Pasos

Para asignar permisos a un usuario admin:

1. Inicia sesión como Super Admin
2. Ve a `/admin/permissions`
3. Selecciona el usuario admin
4. Marca los permisos que deseas asignar
5. Guarda los cambios

Los permisos se aplican inmediatamente y el usuario puede acceder a las páginas correspondientes.

