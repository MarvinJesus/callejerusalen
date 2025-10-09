# 🔧 Corrección Crítica: Usuarios Pending NO Pueden Iniciar Sesión

## ⚠️ Cambio Importante

**ANTES (Incorrecto):** Usuarios con `status='pending'` podían iniciar sesión  
**AHORA (Correcto):** Usuarios con `status='pending'` **NO** pueden iniciar sesión

---

## 📋 Razón del Cambio

Los usuarios que se registran deben esperar la aprobación del administrador ANTES de poder acceder al sistema. Permitir que usuarios pendientes inicien sesión podría:
- Dar acceso a funcionalidades sin verificación
- Crear problemas de seguridad
- Confundir al usuario sobre su estado real

---

## ✅ Solución Implementada

### 1. Bloqueo de Login para Usuarios Pending (`lib/auth.ts`)

**Agregado bloqueo específico:**
```typescript
// ❌ Usuarios con status 'pending' NO pueden iniciar sesión
if (userStatus === 'pending') {
  await signOut(auth);
  
  const error: any = new Error(
    'Tu cuenta está pendiente de aprobación por un administrador. ' +
    'Recibirás un email cuando tu cuenta sea aprobada.'
  );
  error.code = 'auth/user-pending';
  throw error;
}
```

### 2. Banner Informativo en Login (`app/login/page.tsx`)

**Detecta el error específico:**
```typescript
else if (error.code === 'auth/user-pending') {
  errorMessage = '⏳ Cuenta Pendiente de Aprobación: ' +
    'Tu solicitud de registro está siendo revisada por un administrador. ' +
    'No podrás iniciar sesión hasta que tu cuenta sea aprobada. ' +
    'Recibirás una notificación cuando esto suceda. ' +
    'Tiempo estimado: 24-48 horas.';
  isBlockedUser = true;
}
```

**Muestra banner amarillo de 20 segundos:**
```typescript
const duration = error.code === 'auth/user-pending' ? 20000 : 15000;
showAlert(errorMessage, 'warning', duration, false);
```

### 3. AuthContext Cierra Sesión Pendientes (`context/AuthContext.tsx`)

**Incluye pending en estados bloqueados:**
```typescript
if (userStatus === 'deleted' || 
    userStatus === 'inactive' || 
    userStatus === 'pending' ||  // ✅ Agregado
    isActive === false) {
  await auth.signOut();
  // ...
}
```

---

## 🎯 Flujo Correcto

### Registro:
```
1. Usuario completa formulario de registro
   ↓
2. Sistema crea cuenta con status='pending' ✅
   ↓
3. Sistema cierra sesión automáticamente
   ↓
4. Redirige a /login?registered=true
   ↓
5. Usuario ve mensaje: "¡Registro exitoso!"
```

### Intento de Login (Cuenta Pending):
```
1. Usuario intenta iniciar sesión
   ↓
2. loginUser() detecta status='pending'
   ↓
3. ❌ Login RECHAZADO
   ↓
4. signOut() cierra cualquier sesión iniciada
   ↓
5. Lanza error con code='auth/user-pending'
   ↓
6. catch detecta el error específico
   ↓
7. 🟡 Banner amarillo aparece (20 segundos)
   ↓
8. Mensaje: "⏳ Cuenta Pendiente de Aprobación..."
   ↓
9. Usuario NO puede acceder al sistema
   ↓
10. Usuario espera aprobación del admin
```

### Aprobación por Admin:
```
1. Admin revisa solicitud
   ↓
2. Admin aprueba la cuenta
   ↓
3. status cambia a 'active'
   ↓
4. isActive cambia a true
   ↓
5. registrationStatus cambia a 'approved'
```

### Login Después de Aprobación:
```
1. Usuario intenta login nuevamente
   ↓
2. loginUser() detecta status='active'
   ↓
3. ✅ Login PERMITIDO
   ↓
4. Toast: "¡Bienvenido de vuelta!"
   ↓
5. Acceso completo al sistema
```

---

## 📊 Estados de Usuario

| Estado | Login Permitido | Banner | Mensaje |
|--------|----------------|--------|---------|
| **pending** | ❌ NO | 🟡 Amarillo (20s) | "Cuenta Pendiente de Aprobación..." |
| **active** | ✅ SÍ | - | "¡Bienvenido de vuelta!" |
| **inactive** | ❌ NO | 🟡 Amarillo (15s) | "Cuenta desactivada..." |
| **deleted** | ❌ NO | 🟡 Amarillo (15s) | "Cuenta eliminada..." |
| **rejected** | ✅ SÍ* | 🔴 Rojo (15s) | "Solicitud Rechazada..." |

*Usuarios rechazados pueden login para ver el mensaje de rechazo

---

## 🧪 Cómo Verificar

### Prueba del Flujo Completo:

#### PASO 1: Registrar Usuario

1. Ve a: http://localhost:3000/register
2. Completa formulario:
   - Email: prueba-pending@test.com
   - Nombre: Usuario Prueba Pending
   - Password: test123456
3. Click "Enviar Solicitud de Registro"
4. Verifica redirección a /login

#### PASO 2: Intentar Login (DEBE FALLAR)

1. En /login, ingresa credenciales:
   - Email: prueba-pending@test.com
   - Password: test123456
2. Click "Iniciar Sesión"

**VERIFICA:**
- ❌ Login es RECHAZADO
- 🟡 Banner amarillo aparece
- ⏱️ Duración: 20 segundos
- 📝 Mensaje: "⏳ Cuenta Pendiente de Aprobación..."
- 📋 Logs en consola:
  ```
  🚨 USUARIO BLOQUEADO/PENDIENTE DETECTADO
  🔍 Código de error: auth/user-pending
  ⚡ Llamando a showAlert AHORA...
  ✅ showAlert ejecutado
  ```

#### PASO 3: Verificar en Firestore

1. Firebase Console → Firestore
2. Busca el usuario creado
3. Verifica:
   - ✅ `status: "pending"`
   - ✅ `isActive: false`
   - ✅ `registrationStatus: "pending"`

#### PASO 4: Aprobar Usuario (Como Admin)

1. Inicia sesión como admin
2. Ve a: http://localhost:3000/admin/super-admin/users
3. Busca al usuario de prueba
4. Click "Aprobar"
5. Confirma aprobación
6. Verifica que status cambió a 'active'

#### PASO 5: Login Exitoso

1. Cierra sesión del admin
2. Intenta login con el usuario de prueba nuevamente
3. **AHORA SÍ debe permitir el login:**
   - ✅ Login EXITOSO
   - ✅ Toast: "¡Bienvenido de vuelta!"
   - ✅ SIN banner amarillo
   - ✅ Acceso completo

---

## 🔍 Logs Esperados

### Durante Registro:
```javascript
📝 Iniciando proceso de registro...
✅ Usuario registrado exitosamente
💾 Creando perfil en Firestore...
📋 Datos del perfil a crear: { status: 'pending', ... }
✅ Perfil creado en Firestore exitosamente
🚪 Cerrando sesión para redirigir al login...
↪️ Redirigiendo al login...
```

### Durante Intento de Login (Pending):
```javascript
📞 Llamando a loginUser...
🔍 Estado de registro verificado: pending
🔍 Perfil de usuario: { status: 'pending', ... }
❌ ERROR CAPTURADO EN CATCH
  - error.code: auth/user-pending
  - error.message: Tu cuenta está pendiente de aprobación...
🚨🚨🚨 USUARIO BLOQUEADO/PENDIENTE DETECTADO
🔍 Código de error: auth/user-pending
⚡ Llamando a showAlert AHORA...
✅ showAlert ejecutado
✅ Banner debería estar visible ahora
```

### Durante Login Después de Aprobación:
```javascript
📞 Llamando a loginUser...
🔍 Estado de registro verificado: approved
🔍 Perfil de usuario: { status: 'active', ... }
✅ Login permitido para usuario con status: active
✅ loginUser retornó: { registrationStatus: 'approved', ... }
```

---

## 📁 Archivos Modificados

### 1. `lib/auth.ts` (líneas 196-204)
- ✅ Agregado bloqueo específico para `status='pending'`
- ✅ Error code: `'auth/user-pending'`
- ✅ Mensaje claro de cuenta pendiente

### 2. `app/login/page.tsx` (líneas 118-120, 134-135)
- ✅ Detección de error `'auth/user-pending'`
- ✅ Mensaje informativo para usuarios pending
- ✅ Banner amarillo de 20 segundos
- ✅ Logs detallados

### 3. `context/AuthContext.tsx` (líneas 81-84)
- ✅ Incluido `'pending'` en estados que causan cierre de sesión
- ✅ Previene sesiones activas de usuarios pending

---

## ⚠️ Mensajes del Sistema

### Banner para Usuario Pending (20 segundos):
```
⏳ Cuenta Pendiente de Aprobación

Tu solicitud de registro está siendo revisada por un administrador. 
No podrás iniciar sesión hasta que tu cuenta sea aprobada. 
Recibirás una notificación cuando esto suceda. 

Tiempo estimado: 24-48 horas.
```

### Toast Después de Registro:
```
✅ ¡Registro exitoso! Ahora inicia sesión con tus credenciales.
```

### Toast en Login:
```
✅ ¡Bienvenido! Inicia sesión para continuar.
```

### Toast Login Exitoso (Aprobado):
```
✅ ¡Bienvenido de vuelta!
```

---

## 🎯 Comparación Antes/Después

| Aspecto | ANTES (Incorrecto) | AHORA (Correcto) |
|---------|-------------------|------------------|
| **Pending puede login** | ✅ Sí | ❌ NO |
| **Banner aparece** | ✅ Después de login | ✅ Al rechazar login |
| **Usuario ve sistema** | ✅ Con acceso limitado | ❌ No ve nada |
| **Seguridad** | ⚠️ Baja | ✅ Alta |
| **UX clara** | ⚠️ Confusa | ✅ Clara |
| **Expectativas** | ⚠️ Poco claras | ✅ Muy claras |

---

## 🛡️ Seguridad

### Protección Multi-Nivel:

1. **Nivel 1 - loginUser():**
   - Verifica status antes de permitir login
   - Rechaza si status !== 'active'
   
2. **Nivel 2 - AuthContext:**
   - Monitorea sesiones activas continuamente
   - Cierra sesión si status cambia a pending/inactive/deleted

3. **Nivel 3 - Firestore Rules:**
   - Reglas de base de datos limitan acceso
   - Solo usuarios activos pueden leer/escribir datos sensibles

---

## 📚 Documentos Relacionados

- **Estado Pending:** `CORRECCION_ESTADO_PENDING.md`
- **Redirección Login:** `CORRECCION_REDIRECCION_LOGIN.md`
- **Flujo Registro:** `FLUJO_REGISTRO_MEJORADO.md`

---

## ✅ Checklist de Verificación

### Registro:
- [ ] Usuario se registra correctamente
- [ ] status = 'pending' en Firestore
- [ ] isActive = false
- [ ] registrationStatus = 'pending'
- [ ] Usuario redirigido a /login

### Intento de Login (Pending):
- [ ] Login es RECHAZADO
- [ ] Banner amarillo aparece
- [ ] Duración: 20 segundos
- [ ] Mensaje sobre cuenta pendiente
- [ ] Logs muestran 'auth/user-pending'
- [ ] Usuario NO accede al sistema

### Aprobación:
- [ ] Admin puede ver usuario pendiente
- [ ] Admin puede aprobar
- [ ] status cambia a 'active'
- [ ] isActive cambia a true

### Login Después de Aprobación:
- [ ] Login es EXITOSO
- [ ] Toast: "¡Bienvenido de vuelta!"
- [ ] SIN banner amarillo
- [ ] Acceso completo funcionando

---

**Fecha de Corrección:** 8 de octubre de 2025  
**Estado:** ✅ COMPLETADO  
**Versión:** 2.2.0  
**Criticidad:** 🔴 ALTA (Seguridad)

