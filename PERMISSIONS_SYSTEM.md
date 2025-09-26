# Sistema de Permisos - Calle Jerusalén Community

## Descripción General

El sistema de permisos permite a los super administradores asignar permisos específicos y granulares a los usuarios administradores, proporcionando un control de acceso más fino que el sistema de roles básico.

## Características Principales

### 1. Permisos Granulares
- **40+ permisos específicos** organizados en 8 categorías
- **Control granular** sobre funcionalidades específicas
- **Asignación individual** de permisos por usuario

### 2. Categorías de Permisos

#### 🔐 Gestión de Usuarios (`USER_MANAGEMENT`)
- `users.view` - Ver lista de usuarios y sus perfiles
- `users.create` - Crear nuevos usuarios en el sistema
- `users.edit` - Editar información de usuarios existentes
- `users.delete` - Eliminar usuarios del sistema
- `users.activate` - Activar usuarios inactivos
- `users.deactivate` - Desactivar usuarios activos

#### 🛡️ Gestión de Roles (`ROLE_MANAGEMENT`)
- `roles.view` - Ver roles disponibles en el sistema
- `roles.assign` - Asignar roles a usuarios
- `permissions.view` - Ver permisos disponibles y asignados
- `permissions.assign` - Asignar permisos específicos a usuarios

#### 📝 Gestión de Registros (`REGISTRATION_MANAGEMENT`)
- `registrations.view` - Ver solicitudes de registro pendientes
- `registrations.approve` - Aprobar solicitudes de registro
- `registrations.reject` - Rechazar solicitudes de registro

#### ⚙️ Gestión del Sistema (`SYSTEM_MANAGEMENT`)
- `system.view` - Ver configuración del sistema
- `system.configure` - Modificar configuración del sistema
- `system.backup` - Crear copias de seguridad del sistema
- `system.restore` - Restaurar desde copias de seguridad

#### 🔒 Gestión de Seguridad (`SECURITY_MANAGEMENT`)
- `security.view` - Ver panel de seguridad
- `security.monitor` - Monitorear actividad de seguridad
- `security.alerts` - Gestionar alertas de seguridad
- `security.cameras` - Acceder a cámaras de seguridad

#### 📊 Reportes y Analytics (`REPORTS_ANALYTICS`)
- `reports.view` - Ver reportes del sistema
- `reports.export` - Exportar reportes
- `analytics.view` - Ver analytics y estadísticas
- `analytics.export` - Exportar datos de analytics

#### 📋 Gestión de Logs (`LOGS_MANAGEMENT`)
- `logs.view` - Ver logs del sistema
- `logs.export` - Exportar logs del sistema
- `logs.delete` - Eliminar logs del sistema

#### 🏘️ Gestión de Comunidad (`COMMUNITY_MANAGEMENT`)
- `community.view` - Ver configuración de la comunidad
- `community.edit` - Editar configuración de la comunidad
- `community.events` - Gestionar eventos comunitarios
- `community.services` - Gestionar servicios comunitarios
- `community.places` - Gestionar lugares de la comunidad

## Implementación Técnica

### Archivos Principales

1. **`lib/permissions.ts`** - Definiciones de permisos y funciones de utilidad
2. **`lib/permission-middleware.ts`** - Middleware para verificación de permisos
3. **`components/PermissionManager.tsx`** - Componente para gestionar permisos
4. **`components/PermissionBadge.tsx`** - Componente para mostrar permisos
5. **`app/api/admin/manage-permissions/route.ts`** - API para gestionar permisos

### Estructura de Datos

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  permissions?: Permission[]; // Array de permisos específicos
  // ... otros campos
}
```

### Verificación de Permisos

```typescript
// Verificar un permiso específico
const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean

// Verificar múltiples permisos (cualquiera)
const hasAnyPermission = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean

// Verificar múltiples permisos (todos)
const hasAllPermissions = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean

// Verificar si puede realizar una acción
const canPerformAction = (userRole: string, userPermissions: Permission[], action: Permission): boolean
```

## Uso en Componentes

### ProtectedRoute con Permisos

```tsx
<ProtectedRoute requiredPermission="users.view">
  <UserList />
</ProtectedRoute>

<ProtectedRoute 
  requiredPermissions={['users.create', 'users.edit']} 
  requireAllPermissions={false}
>
  <UserManagement />
</ProtectedRoute>
```

### Hook usePermissions

```tsx
const { hasPermission, hasAnyPermission, canPerformAction } = usePermissions(userProfile);

if (hasPermission('users.create')) {
  // Mostrar botón de crear usuario
}
```

### Componentes de Protección

```tsx
<PermissionGuard permission="users.edit" userProfile={userProfile}>
  <EditUserButton />
</PermissionGuard>

<MultiPermissionGuard 
  permissions={['users.create', 'users.edit']} 
  userProfile={userProfile}
  requireAll={false}
>
  <UserActions />
</MultiPermissionGuard>
```

## Gestión de Permisos

### Desde el Dashboard de Administración

1. **Acceder a la pestaña "Permisos"** (solo super admins)
2. **Seleccionar un usuario administrador**
3. **Gestionar permisos por categoría:**
   - Expandir/contraer grupos de permisos
   - Activar/desactivar permisos individuales
   - Ver cambios pendientes
   - Guardar o cancelar cambios

### API Endpoints

#### Asignar/Revocar Permisos
```http
POST /api/admin/manage-permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetUserId": "user123",
  "permissions": ["users.view", "users.create"],
  "action": "assign" // "assign", "revoke", "replace"
}
```

#### Obtener Permisos de Usuario
```http
GET /api/admin/manage-permissions?userId=user123
Authorization: Bearer <token>
```

## Permisos por Defecto

### Super Administrador
- **Todos los permisos** - Acceso completo al sistema

### Administrador
- `users.view` - Ver usuarios
- `registrations.view` - Ver solicitudes
- `security.view` - Ver seguridad
- `reports.view` - Ver reportes
- `analytics.view` - Ver analytics
- `logs.view` - Ver logs
- `community.view` - Ver comunidad

### Comunidad
- **Sin permisos especiales** - Solo acceso básico

### Visitante
- **Sin permisos especiales** - Solo acceso público

## Seguridad

### Medidas Implementadas

1. **Verificación en Cliente y Servidor**
   - Middleware de permisos en componentes
   - Verificación en API routes
   - Validación en base de datos

2. **Protección de Rutas**
   - ProtectedRoute con verificación de permisos
   - Redirección automática si no tiene permisos
   - Mensajes de error informativos

3. **Auditoría**
   - Log de todas las asignaciones/revocaciones de permisos
   - Registro de quién realizó la acción
   - Timestamp de todas las operaciones

4. **Validación de Datos**
   - Validación de permisos válidos
   - Verificación de roles de usuario
   - Protección contra modificación del super admin principal

## Flujo de Trabajo

### 1. Super Admin Asigna Permisos
```
Super Admin → Dashboard → Pestaña Permisos → Seleccionar Usuario → Gestionar Permisos → Guardar
```

### 2. Usuario Admin Usa Permisos
```
Usuario Admin → Accede a Funcionalidad → Verificación de Permisos → Acceso Permitido/Denegado
```

### 3. Verificación Automática
```
Cada Acción → Middleware → Verificar Permisos → Permitir/Denegar → Log de Acción
```

## Ejemplos de Uso

### Escenario 1: Admin Solo de Lectura
```typescript
// Permisos asignados
const permissions = [
  'users.view',
  'registrations.view', 
  'security.view',
  'reports.view',
  'analytics.view',
  'logs.view'
];

// Puede ver información pero no modificar
```

### Escenario 2: Admin de Gestión de Usuarios
```typescript
// Permisos asignados
const permissions = [
  'users.view',
  'users.create',
  'users.edit',
  'users.activate',
  'users.deactivate',
  'registrations.view',
  'registrations.approve',
  'registrations.reject'
];

// Puede gestionar usuarios completamente
```

### Escenario 3: Admin de Seguridad
```typescript
// Permisos asignados
const permissions = [
  'security.view',
  'security.monitor',
  'security.alerts',
  'security.cameras',
  'logs.view',
  'reports.view'
];

// Puede monitorear seguridad y ver reportes
```

## Mantenimiento

### Agregar Nuevos Permisos

1. **Definir en `lib/permissions.ts`:**
   ```typescript
   export type Permission = 
     | 'existing.permission'
     | 'new.permission'; // Agregar aquí
   ```

2. **Agregar descripción:**
   ```typescript
   export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
     'new.permission': 'Descripción del nuevo permiso'
   };
   ```

3. **Agregar a grupo correspondiente:**
   ```typescript
   export const PERMISSION_GROUPS = {
     EXISTING_GROUP: [
       'existing.permission',
       'new.permission' // Agregar aquí
     ]
   };
   ```

4. **Actualizar permisos por defecto si es necesario**

### Modificar Permisos Existentes

1. **Actualizar descripción en `PERMISSION_DESCRIPTIONS`**
2. **Mover entre grupos si es necesario**
3. **Actualizar lógica de verificación si cambia el comportamiento**

## Troubleshooting

### Problemas Comunes

1. **Usuario no puede acceder a funcionalidad**
   - Verificar que tenga el permiso específico
   - Comprobar que el permiso esté correctamente asignado
   - Verificar que el componente use la verificación correcta

2. **Permisos no se guardan**
   - Verificar que el usuario sea super admin
   - Comprobar logs de la API
   - Verificar conexión con Firebase

3. **Error de permisos en API**
   - Verificar token de autenticación
   - Comprobar que el usuario tenga rol de super admin
   - Verificar que los permisos sean válidos

### Logs y Debugging

```typescript
// Habilitar logs de permisos
console.log('User Permissions:', userProfile?.permissions);
console.log('Required Permission:', requiredPermission);
console.log('Has Permission:', hasPermission(userProfile?.permissions || [], requiredPermission));
```

## Futuras Mejoras

1. **Permisos Temporales** - Asignar permisos con fecha de expiración
2. **Permisos Condicionales** - Permisos que dependen de condiciones específicas
3. **Plantillas de Permisos** - Conjuntos predefinidos de permisos
4. **Permisos por Recurso** - Permisos específicos por recurso (ej: solo ciertos usuarios)
5. **Auditoría Avanzada** - Reportes detallados de uso de permisos
