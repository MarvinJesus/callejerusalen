# Protección del Rol Super-Admin

## 📋 Resumen

Se ha implementado una protección completa en múltiples niveles para el rol de Super Administrador:

1. **Solo el super administrador principal (mar90jesus@gmail.com)** puede asignar el rol de `super_admin` a otros usuarios
2. **Solo super-admins pueden editar a otros super-admins** - Los admins regulares no pueden editar usuarios con rol `super_admin`
3. **NADIE puede editar al super-admin principal** - El usuario mar90jesus@gmail.com está completamente protegido de cualquier modificación

## 🎯 Objetivos

### Restricciones para Usuarios Admin (No Super-Admin)
- ❌ NO pueden crear nuevos usuarios con rol `super_admin`
- ❌ NO pueden cambiar el rol de usuarios existentes a `super_admin`
- ❌ NO pueden aprobar solicitudes de registro con rol `super_admin`
- ❌ NO pueden editar a usuarios que ya son `super_admin`
- ❌ NO pueden ver el botón de editar para usuarios `super_admin`
- ❌ NO pueden eliminar a usuarios `super_admin`
- ❌ NO pueden desactivar a usuarios `super_admin`
- ❌ NO pueden ver botones de eliminar/desactivar para usuarios `super_admin`

### Restricciones para Super-Admins (Excepto el Principal)
- ✅ PUEDEN editar a otros super-admins
- ✅ PUEDEN editar a usuarios de cualquier rol
- ✅ PUEDEN eliminar a otros super-admins
- ✅ PUEDEN desactivar a otros super-admins
- ❌ NO pueden asignar el rol `super_admin` (solo el principal)
- ❌ NO pueden editar al super-admin principal (mar90jesus@gmail.com)
- ❌ NO pueden eliminar al super-admin principal
- ❌ NO pueden desactivar al super-admin principal

### Protecciones para el Super-Admin Principal (mar90jesus@gmail.com)
- ✅ Control total sobre todos los usuarios
- ✅ Único que puede asignar el rol `super_admin`
- 🔒 **NADIE puede editarlo** (ni siquiera otros super-admins)
- 🔒 **NADIE puede eliminarlo** (protección absoluta)
- 🔒 **NADIE puede desactivarlo** (protección absoluta)

## ✅ Cambios Implementados

### 1. Nueva Función: canEditSpecificUser
**Archivo:** `app/admin/admin-dashboard/page.tsx`

**Cambios:**
- Se creó una nueva función `canEditSpecificUser(targetUser)` que determina si el usuario actual puede editar a un usuario específico
- La función implementa las siguientes reglas:
  - NADIE puede editar al super-admin principal (mar90jesus@gmail.com)
  - Solo super-admins pueden editar a otros super-admins
  - Para otros usuarios, se verifican los permisos normales

```tsx
const canEditSpecificUser = (targetUser: UserProfile) => {
  if (!userProfile) return false;
  
  // NADIE puede editar al super-admin principal
  if (isMainSuperAdmin(targetUser.email)) {
    return false;
  }
  
  // Solo super-admins pueden editar a otros super-admins
  if (targetUser.role === 'super_admin') {
    return userProfile.role === 'super_admin';
  }
  
  // Para otros usuarios, verificar permisos normales
  return canEditUsers();
};
```

### 2. Protección Visual - Botón de Editar
**Archivo:** `app/admin/admin-dashboard/page.tsx`

**Cambios:**
- El botón de editar ahora usa `canEditSpecificUser(user)` en lugar de solo `canEditUsers()`
- Los admins ya NO ven el botón de editar para usuarios super-admin
- El super-admin principal no tiene botón de editar visible para nadie

```tsx
{canEditSpecificUser(user) && (
  <button onClick={() => setShowEditUser(user)}>
    <Edit className="w-4 h-4" />
  </button>
)}
```

### 3. Nueva Función: canDeleteOrDeactivateSpecificUser
**Archivo:** `app/admin/admin-dashboard/page.tsx`

**Cambios:**
- Se creó una nueva función `canDeleteOrDeactivateSpecificUser(targetUser)` que determina si el usuario actual puede eliminar o desactivar a un usuario específico
- La función implementa las siguientes reglas:
  - NADIE puede eliminar/desactivar al super-admin principal (mar90jesus@gmail.com)
  - Solo super-admins pueden eliminar/desactivar a otros super-admins
  - Para otros usuarios, se verifican los permisos normales

```tsx
const canDeleteOrDeactivateSpecificUser = (targetUser: UserProfile) => {
  if (!userProfile) return false;
  
  // NADIE puede eliminar/desactivar al super-admin principal
  if (isMainSuperAdmin(targetUser.email)) {
    return false;
  }
  
  // Solo super-admins pueden eliminar/desactivar a otros super-admins
  if (targetUser.role === 'super_admin') {
    return userProfile.role === 'super_admin';
  }
  
  // Para otros usuarios, verificar permisos normales
  return canDeleteUser(targetUser.email);
};
```

### 4. Protección Visual - Botones de Eliminar/Desactivar
**Archivo:** `app/admin/admin-dashboard/page.tsx`

**Cambios:**
- Los botones de eliminar y desactivar ahora usan `canDeleteOrDeactivateSpecificUser(user)` en lugar de solo `canDeleteUser()`
- Los admins ya NO ven botones de eliminar/desactivar para usuarios super-admin
- El super-admin principal no tiene botones de eliminar/desactivar visibles para nadie

```tsx
{canDeleteOrDeactivateSpecificUser(user) && (
  <>
    {/* Botones de desactivar, eliminar, etc. */}
  </>
)}
```

### 5. Validación en handleUpdateUser
**Archivo:** `app/admin/admin-dashboard/page.tsx`

**Cambios:**
- Se agregaron validaciones múltiples antes de permitir la actualización:
  - Verifica que no se esté intentando editar al super-admin principal
  - Verifica que solo super-admins puedan editar a otros super-admins
  - Mensajes de error claros y específicos

```tsx
// NADIE puede editar al super-admin principal
if (isMainSuperAdmin(userEmail)) {
  alert('❌ No se puede editar al super administrador principal');
  return;
}

// Solo super-admins pueden editar a otros super-admins
if (targetUser.role === 'super_admin' && userProfile.role !== 'super_admin') {
  alert('❌ Solo un super administrador puede editar a otro super administrador');
  return;
}
```

### 6. Validaciones en handleDeleteUser y showConfirmationModal
**Archivo:** `app/admin/admin-dashboard/page.tsx`

**Cambios:**
- Se agregaron validaciones en `handleDeleteUser()` antes de intentar eliminar
- Se agregaron validaciones en `showConfirmationModal()` antes de mostrar el modal de confirmación
- Validaciones en `handleConfirmAction()` antes de ejecutar la acción
- Mensajes de error específicos según el tipo de intento de violación

```tsx
// En handleDeleteUser
if (!canDeleteOrDeactivateSpecificUser(user)) {
  if (isMainSuperAdmin(user.email)) {
    alert('❌ No se puede eliminar al super administrador principal');
  } else if (user.role === 'super_admin' && userProfile?.role !== 'super_admin') {
    alert('❌ Solo un super administrador puede eliminar a otro super administrador');
  }
  return;
}
```

### 7. Interfaz de Usuario - Modal de Crear Usuario
**Archivo:** `app/admin/admin-dashboard/page.tsx`

**Cambios:**
- Se añadió el hook `useAuth()` al componente `CreateUserModal` para obtener el perfil del usuario actual
- Se agregó validación `isMainSuperAdminUser` para verificar si el usuario actual es `mar90jesus@gmail.com`
- La opción "Super Administrador" en el selector de roles **solo se muestra** si el usuario es el super-admin principal
- Se agregó un mensaje informativo cuando la opción no está disponible

```tsx
{isMainSuperAdminUser && (
  <option value="super_admin">Super Administrador</option>
)}
{!isMainSuperAdminUser && (
  <p className="text-xs text-gray-500 mt-1">
    ℹ️ Solo el super administrador principal puede asignar el rol de Super Administrador
  </p>
)}
```

### 2. Interfaz de Usuario - Modal de Editar Usuario
**Archivo:** `app/admin/admin-dashboard/page.tsx`

**Cambios:**
- Se añadió el hook `useAuth()` al componente `EditUserModal` para obtener el perfil del usuario actual
- Se agregó validación `isMainSuperAdminUser` para verificar si el usuario actual es `mar90jesus@gmail.com`
- La opción "Super Administrador" en el selector de roles **solo se muestra** si el usuario es el super-admin principal
- Se agregó un mensaje informativo cuando la opción no está disponible

```tsx
{isMainSuperAdminUser && (
  <option value="super_admin">Super Administrador</option>
)}
{!isMainSuperAdminUser && !isMainSuperAdmin(user.email) && (
  <p className="text-xs text-gray-500 mt-1">
    ℹ️ Solo el super administrador principal puede asignar el rol de Super Administrador
  </p>
)}
```

### 3. Backend - API de Creación de Usuarios
**Archivo:** `app/api/admin/create-user/route.ts`

**Cambios:**
- Se agregó validación de servidor para verificar que solo `mar90jesus@gmail.com` puede crear usuarios con rol `super_admin`
- Retorna error 403 (Forbidden) si un usuario no autorizado intenta asignar el rol

```typescript
// 🔐 PROTECCIÓN: Solo el super-admin principal puede asignar el rol de super_admin
if (role === 'super_admin' && createdBy !== 'mar90jesus@gmail.com') {
  return NextResponse.json(
    { error: 'Solo el super administrador principal puede asignar el rol de Super Administrador' },
    { status: 403 }
  );
}
```

### 4. Backend - Función de Actualización de Usuarios (MEJORADA)
**Archivo:** `lib/auth.ts` - Función `updateUserAsAdmin`

**Cambios:**
- Se agregaron **TRES niveles de protección** en el backend:
  1. **Protección del super-admin principal:** NADIE puede editarlo
  2. **Protección de super-admins:** Solo otros super-admins pueden editarlos
  3. **Protección de asignación de rol:** Solo el super-admin principal puede asignar el rol `super_admin`

```typescript
// 🔐 PROTECCIÓN CRÍTICA: NADIE puede editar al super-admin principal
if (isMainSuperAdmin(userProfile.email)) {
  throw new Error('No se puede editar al super administrador principal');
}

// Obtener el perfil del usuario que está haciendo la actualización
const updaterProfile = await getUserProfile(updatedBy);
if (!updaterProfile) {
  throw new Error('Usuario actualizador no encontrado');
}

// 🔐 PROTECCIÓN: Solo super-admins pueden editar a otros super-admins
if (userProfile.role === 'super_admin' && updaterProfile.role !== 'super_admin') {
  throw new Error('Solo un super administrador puede editar a otro super administrador');
}

// 🔐 PROTECCIÓN: Solo el super-admin principal puede asignar el rol de super_admin
if (updates.role === 'super_admin') {
  if (updaterProfile.email !== 'mar90jesus@gmail.com') {
    throw new Error('Solo el super administrador principal puede asignar el rol de Super Administrador');
  }
}
```

### 5. Backend - Función de Aprobación de Registros
**Archivo:** `lib/auth.ts` - Función `approveRegistration`

**Cambios:**
- Se agregó validación para verificar que solo el super-admin principal puede aprobar registros con rol `super_admin`
- Se obtiene el perfil del usuario aprobador
- Se verifica que sea `mar90jesus@gmail.com` antes de permitir la aprobación

```typescript
// 🔐 PROTECCIÓN: Solo el super-admin principal puede aprobar con rol de super_admin
if (approvedRole === 'super_admin') {
  const approverProfile = await getUserProfile(approvedBy);
  if (!approverProfile || approverProfile.email !== 'mar90jesus@gmail.com') {
    throw new Error('Solo el super administrador principal puede aprobar usuarios con el rol de Super Administrador');
  }
}
```

### 6. Backend - Función de Cambio de Estado de Usuarios (MEJORADA)
**Archivo:** `lib/auth.ts` - Función `changeUserStatus`

**Cambios:**
- Se agregaron **DOS niveles de protección** adicionales en el backend:
  1. **Protección del super-admin principal:** NADIE puede modificar su estado
  2. **Protección de super-admins:** Solo otros super-admins pueden modificar el estado de un super-admin

**Nota:** Esta función es usada por `deleteUserAsAdmin`, `reactivateUser` y `recoverUser`, por lo que la protección aplica a todas estas operaciones.

```typescript
// 🔐 PROTECCIÓN CRÍTICA: No se puede modificar el estado del super admin principal
if (isMainSuperAdmin(userData.email)) {
  throw new Error('No se puede modificar el estado del super administrador principal. Este usuario tiene protección permanente.');
}

// Obtener el perfil del usuario que está haciendo el cambio
const changerProfile = await getUserProfile(changedBy);
if (!changerProfile) {
  throw new Error('Usuario que realiza el cambio no encontrado');
}

// 🔐 PROTECCIÓN: Solo super-admins pueden modificar el estado de otros super-admins
if (userData.role === 'super_admin' && changerProfile.role !== 'super_admin') {
  throw new Error('Solo un super administrador puede modificar el estado de otro super administrador');
}
```

**Funciones afectadas:**
- `deleteUserAsAdmin()` - Eliminar usuario
- `reactivateUser()` - Reactivar usuario
- `recoverUser()` - Recuperar usuario eliminado
- `changeUserStatus()` - Cambiar cualquier estado

## 🔒 Niveles de Protección

### Nivel 1: Interfaz de Usuario (Visual)
- Los usuarios que no son el super-admin principal **no ven** la opción de seleccionar "Super Administrador"
- Los admins **no ven el botón de editar** para usuarios con rol super-admin
- Los admins **no ven botones de eliminar/desactivar** para usuarios con rol super-admin
- **NADIE** ve el botón de editar para el super-admin principal (mar90jesus@gmail.com)
- **NADIE** ve botones de eliminar/desactivar para el super-admin principal
- Mensajes informativos claros indicando las restricciones

### Nivel 2: Validación de Cliente (Frontend)
- Los modales verifican la identidad del usuario antes de mostrar opciones
- Función `canEditSpecificUser()` valida permisos de edición antes de mostrar botones
- Función `canDeleteOrDeactivateSpecificUser()` valida permisos de eliminación/desactivación antes de mostrar botones
- Validaciones en `handleUpdateUser()` antes de enviar peticiones al servidor
- Validaciones en `handleDeleteUser()` y `showConfirmationModal()` antes de eliminar/desactivar
- Validaciones en `handleConfirmAction()` antes de ejecutar cualquier acción de estado
- Mensajes de error específicos para cada tipo de restricción

### Nivel 3: Validación de Servidor (Backend)
- Todas las funciones de backend validan múltiples niveles de permisos
- Triple verificación en `updateUserAsAdmin()`:
  1. Protección del super-admin principal
  2. Verificación de permisos para editar super-admins
  3. Protección de asignación de rol super_admin
- Doble verificación en `changeUserStatus()`:
  1. Protección del super-admin principal
  2. Verificación de permisos para modificar estado de super-admins
- Validaciones en:
  - Creación de usuarios (API route + validación de rol)
  - Actualización de usuarios (función de auth + múltiples protecciones)
  - Aprobación de registros (función de auth + validación de rol)
  - Cambio de estado (eliminar, desactivar, reactivar, recuperar)

## 🧪 Casos de Prueba

### ✅ Caso 1: Super-Admin Principal (mar90jesus@gmail.com)
**Usuario:** mar90jesus@gmail.com  
**Acciones permitidas:**
- ✅ Puede ver la opción "Super Administrador" al crear usuarios
- ✅ Puede ver la opción "Super Administrador" al editar usuarios
- ✅ Puede asignar el rol super_admin sin errores
- ✅ Puede aprobar registros con rol super_admin
- ✅ Puede editar a cualquier usuario (excepto a sí mismo)
- ✅ Control total sobre la gestión de usuarios
- ❌ NO puede editarse a sí mismo (protección absoluta)

### 🟡 Caso 2: Super-Admin Secundario
**Usuario:** Cualquier super-admin que NO sea mar90jesus@gmail.com  
**Acciones permitidas:**
- ✅ Puede editar a otros super-admins
- ✅ Puede editar a usuarios de cualquier rol
- ✅ Ve el botón de editar para super-admins
- ❌ NO ve la opción "Super Administrador" al crear usuarios
- ❌ NO puede asignar el rol super_admin
- ❌ NO puede editar a mar90jesus@gmail.com
- ❌ NO puede aprobar registros con rol super_admin

### ❌ Caso 3: Usuario Admin Regular
**Usuario:** Cualquier admin que NO sea super-admin  
**Resultado esperado:**
- ❌ NO ve la opción "Super Administrador" al crear usuarios
- ❌ NO ve la opción "Super Administrador" al editar usuarios
- ❌ NO ve el botón de editar para usuarios super-admin
- ❌ NO puede editar a mar90jesus@gmail.com
- ❌ Ve mensaje informativo sobre la restricción
- ❌ Si intenta editar un super-admin, recibe error: "Solo un super administrador puede editar a otro super administrador"

### 🛑 Caso 4: Intento de Editar al Super-Admin Principal
**Escenario:** Cualquier usuario (incluso super-admin) intenta editar a mar90jesus@gmail.com  
**Resultado esperado:**
- ❌ NO ve el botón de editar
- ❌ Si intenta forzar la edición, recibe error: "No se puede editar al super administrador principal"
- ❌ La operación es bloqueada en el backend
- 🔒 Protección absoluta del super-admin principal

### 🛑 Caso 5: Admin Intenta Editar Super-Admin
**Escenario:** Un admin intenta editar a un usuario con rol super_admin  
**Resultado esperado:**
- ❌ NO ve el botón de editar (protección visual)
- ❌ Si intenta forzar la edición (bypass frontend), recibe error en el backend
- ❌ Error: "Solo un super administrador puede editar a otro super administrador"
- ❌ La operación no se completa

### 🛑 Caso 6: Intento de Bypass - Asignar Rol Super-Admin
**Escenario:** Admin/Super-admin secundario intenta manipular el código del cliente para asignar rol super_admin  
**Resultado esperado:**
- ❌ El backend rechaza la petición
- ❌ Se muestra error: "Solo el super administrador principal puede asignar el rol de Super Administrador"
- ❌ La operación no se completa

## 📍 Ubicación de Archivos Modificados

```
callejerusalen.com/
├── app/
│   ├── admin/
│   │   └── admin-dashboard/
│   │       └── page.tsx                    ← Modales de crear/editar usuario
│   └── api/
│       └── admin/
│           └── create-user/
│               └── route.ts                ← API de creación de usuarios
└── lib/
    └── auth.ts                             ← Funciones updateUserAsAdmin y approveRegistration
```

## 🎨 Experiencia de Usuario

### Para Super-Admin Principal (mar90jesus@gmail.com)
- Experiencia sin cambios
- Todas las opciones disponibles
- Control total sobre asignación de roles

### Para Administradores Regulares
- Interfaz limpia sin opciones no disponibles
- Mensaje claro explicando la restricción
- No se generan errores ni confusión

## 🔐 Seguridad

### Protecciones Implementadas
1. **Validación de Frontend:** Oculta opciones no disponibles
2. **Validación de Backend en API Routes:** Verifica permisos antes de crear usuarios
3. **Validación de Backend en Funciones:** Verifica permisos antes de actualizar o aprobar
4. **Verificación de Email Hardcoded:** Usa el email `mar90jesus@gmail.com` como constante de seguridad

### Consideraciones de Seguridad
- ⚠️ El email del super-admin principal está hardcoded en múltiples lugares
- ✅ Esto es intencional para máxima seguridad
- ✅ Múltiples capas de validación evitan bypass
- ✅ Las validaciones de servidor son la protección final

## 📝 Notas Adicionales

### Email del Super-Admin Principal
El email `mar90jesus@gmail.com` está definido en:
- `CreateUserModal` component
- `EditUserModal` component
- `app/api/admin/create-user/route.ts`
- `lib/auth.ts` (funciones `updateUserAsAdmin` y `approveRegistration`)
- `context/AuthContext.tsx` (para protección de acceso)

### Compatibilidad
- ✅ Compatible con el sistema de permisos existente
- ✅ No afecta otras funcionalidades del dashboard
- ✅ Mantiene la protección existente del super-admin principal

## ✅ Estado

**Implementación completa** - Protección multi-nivel implementada  
**Fecha:** 9 de Octubre, 2025  
**Versión:** 2.0 (Mejorada)

### Cambios en esta versión:
- ✅ Protección visual para botones de editar
- ✅ Función `canEditSpecificUser()` para validaciones específicas
- ✅ Validaciones en `handleUpdateUser()` con mensajes claros
- ✅ Triple protección en backend para `updateUserAsAdmin()`
- ✅ Protección absoluta del super-admin principal
- ✅ Solo super-admins pueden editar a otros super-admins

## 🚀 Despliegue

No se requieren cambios en:
- Base de datos
- Variables de entorno
- Configuración de Firebase
- Migraciones

Los cambios son solo de código y entran en efecto inmediatamente después del despliegue.

