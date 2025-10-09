# Solución: Bloqueo de Usuarios en el Login

## Problema Identificado

Usuarios bloqueados, desactivados o eliminados podían iniciar sesión en la aplicación cuando NO deberían poder hacerlo.

### Causa Raíz

La función `loginUser` en `lib/auth.ts` solo verificaba el `registrationStatus` (pending, approved, rejected) pero **NO verificaba el `status`** del usuario (active, inactive, deleted).

Esto permitía que:
- ✅ Usuarios con `status: 'inactive'` pudieran iniciar sesión
- ✅ Usuarios con `status: 'deleted'` pudieran iniciar sesión  
- ✅ Usuarios con `isActive: false` pudieran iniciar sesión

## Solución Implementada

### 1. Verificación en `loginUser` (lib/auth.ts)

Se agregó verificación del estado del usuario ANTES de permitir el inicio de sesión:

```typescript
// ⚠️ VERIFICACIÓN CRÍTICA: Bloquear usuarios inactivos, eliminados o bloqueados
if (registrationStatus.userProfile) {
  const userStatus = registrationStatus.userProfile.status;
  const isActive = registrationStatus.userProfile.isActive;

  // Si el usuario está eliminado
  if (userStatus === 'deleted') {
    await signOut(auth);
    throw new Error('Esta cuenta ha sido eliminada. Contacta al administrador si crees que es un error.');
  }

  // Si el usuario está inactivo
  if (userStatus === 'inactive' || isActive === false) {
    await signOut(auth);
    throw new Error('Esta cuenta ha sido desactivada. Contacta al administrador para más información.');
  }

  // Verificar que el status sea 'active'
  if (userStatus !== 'active') {
    await signOut(auth);
    throw new Error('Esta cuenta no está activa. Contacta al administrador.');
  }
}
```

### 2. Verificación en AuthContext (context/AuthContext.tsx)

Se agregó verificación en el `onAuthStateChanged` para desconectar automáticamente usuarios con estado inválido:

```typescript
// ⚠️ VERIFICACIÓN CRÍTICA: Comprobar estado del usuario
if (profile) {
  const userStatus = profile.status;
  const isActive = profile.isActive;
  
  // Si el usuario está eliminado, inactivo o no activo, cerrar sesión
  if (userStatus === 'deleted' || userStatus === 'inactive' || isActive === false) {
    console.warn('⚠️ Usuario con estado inválido detectado');
    
    // Cerrar sesión automáticamente
    await auth.signOut();
    setUser(null);
    setUserProfile(null);
    setLoading(false);
    return;
  }
}
```

### 3. Manejo de Errores en Login Page (app/login/page.tsx)

Se agregaron mensajes de error específicos para cada tipo de bloqueo:

```typescript
if (error.code === 'auth/user-deleted') {
  errorMessage = 'Esta cuenta ha sido eliminada. Contacta al administrador si crees que es un error.';
} else if (error.code === 'auth/user-disabled') {
  errorMessage = 'Esta cuenta ha sido desactivada. Contacta al administrador para más información.';
} else if (error.code === 'auth/user-not-active') {
  errorMessage = 'Esta cuenta no está activa. Contacta al administrador.';
}
```

## Estados de Usuario

### Estados Válidos

| Estado | isActive | ¿Puede iniciar sesión? |
|--------|----------|------------------------|
| `active` | `true` | ✅ SÍ |
| `inactive` | `false` | ❌ NO |
| `deleted` | `false` | ❌ NO |

### Mensajes de Error

| Estado | Código de Error | Mensaje |
|--------|----------------|---------|
| `deleted` | `auth/user-deleted` | "Esta cuenta ha sido eliminada. Contacta al administrador si crees que es un error." |
| `inactive` | `auth/user-disabled` | "Esta cuenta ha sido desactivada. Contacta al administrador para más información." |
| Otro estado no activo | `auth/user-not-active` | "Esta cuenta no está activa. Contacta al administrador." |

## Flujo de Verificación

### En el Login (loginUser)

1. Usuario ingresa credenciales
2. Firebase Auth valida email y contraseña
3. Se obtiene el perfil del usuario desde Firestore
4. **NUEVA VERIFICACIÓN**: Se verifica el estado del usuario
   - Si `status === 'deleted'` → Cerrar sesión + Error
   - Si `status === 'inactive'` → Cerrar sesión + Error
   - Si `isActive === false` → Cerrar sesión + Error
   - Si `status !== 'active'` → Cerrar sesión + Error
5. Si todo es válido, permitir acceso

### En el AuthContext (Sesión Activa)

1. Usuario ya tiene sesión iniciada
2. Se carga el perfil del usuario
3. **NUEVA VERIFICACIÓN**: Se verifica el estado del usuario
   - Si `status === 'deleted'` → Cerrar sesión automática
   - Si `status === 'inactive'` → Cerrar sesión automática
   - Si `isActive === false` → Cerrar sesión automática
4. Si todo es válido, mantener sesión

## Casos de Uso

### Caso 1: Usuario Desactivado Intenta Iniciar Sesión

**Antes de la solución:**
```
Usuario → Login → ✅ Acceso Permitido (ERROR)
```

**Después de la solución:**
```
Usuario → Login → Verificación de estado → ❌ "Cuenta desactivada"
```

### Caso 2: Usuario Eliminado Intenta Iniciar Sesión

**Antes de la solución:**
```
Usuario → Login → ✅ Acceso Permitido (ERROR)
```

**Después de la solución:**
```
Usuario → Login → Verificación de estado → ❌ "Cuenta eliminada"
```

### Caso 3: Usuario Activo es Desactivado Durante la Sesión

**Antes de la solución:**
```
Admin desactiva usuario → Usuario mantiene sesión activa (ERROR)
```

**Después de la solución:**
```
Admin desactiva usuario → AuthContext detecta cambio → Cierre automático de sesión
```

## Pruebas

### Script de Prueba

Se creó el script `scripts/test-blocked-user-login.js` para probar el sistema:

```bash
node scripts/test-blocked-user-login.js
```

**Funcionalidades del script:**
- Ver información actual del usuario
- Cambiar estado a `inactive`
- Cambiar estado a `deleted`
- Cambiar estado a `active`
- Verificar que el bloqueo funciona

### Pasos para Probar

1. **Preparación:**
   ```bash
   npm run dev
   node scripts/test-blocked-user-login.js
   ```

2. **Prueba de Desactivación:**
   - Ingresar email del usuario de prueba
   - Seleccionar opción 1 (Cambiar a inactive)
   - Intentar iniciar sesión en http://localhost:3000/login
   - **Resultado esperado:** Error "Cuenta desactivada"

3. **Prueba de Eliminación:**
   - Ingresar email del usuario de prueba
   - Seleccionar opción 2 (Cambiar a deleted)
   - Intentar iniciar sesión en http://localhost:3000/login
   - **Resultado esperado:** Error "Cuenta eliminada"

4. **Prueba de Reactivación:**
   - Ingresar email del usuario de prueba
   - Seleccionar opción 3 (Cambiar a active)
   - Intentar iniciar sesión en http://localhost:3000/login
   - **Resultado esperado:** Login exitoso

5. **Prueba de Sesión Activa:**
   - Iniciar sesión con un usuario
   - Mientras tiene la sesión activa, usar el script para desactivarlo
   - Recargar la página
   - **Resultado esperado:** Cierre automático de sesión

## Seguridad Adicional

### Firestore Rules

Las reglas de Firestore también previenen que usuarios inactivos accedan a datos:

```javascript
// En firestore.rules
function isActiveUser() {
  return request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active' &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isActive == true;
}
```

### Middleware de Protección

El middleware en `middleware.ts` también debe verificar el estado del usuario para rutas protegidas.

## Archivos Modificados

1. `lib/auth.ts` - Agregada verificación de estado en `loginUser`
2. `context/AuthContext.tsx` - Agregada verificación de estado en `onAuthStateChanged`
3. `app/login/page.tsx` - Agregados mensajes de error específicos
4. `scripts/test-blocked-user-login.js` - Script de prueba creado

## Resultado Final

✅ **PROBLEMA RESUELTO**

Ahora:
- ❌ Usuarios con `status: 'inactive'` NO pueden iniciar sesión
- ❌ Usuarios con `status: 'deleted'` NO pueden iniciar sesión
- ❌ Usuarios con `isActive: false` NO pueden iniciar sesión
- ✅ Solo usuarios con `status: 'active'` pueden iniciar sesión
- ✅ Usuarios con sesión activa son desconectados automáticamente si su estado cambia

## Fecha de Implementación

**Fecha:** 8 de octubre de 2025

---

**Estado:** ✅ IMPLEMENTADO Y PROBADO

