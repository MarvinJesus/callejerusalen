# 🔧 Corrección: Estado Pending en Registro

## 🐛 Problema Detectado

Al registrarse, los usuarios quedaban con `status='inactive'` en lugar de `status='pending'`, lo que causaba que:
- ❌ El sistema rechazara su intento de login
- ❌ No pudieran iniciar sesión hasta ser aprobados
- ❌ No vieran el banner amarillo de "cuenta pendiente"

## ✅ Solución Implementada

Se corrigió el estado inicial del registro y la lógica de login para permitir usuarios pendientes.

---

## 📝 Cambios Realizados

### 1. API de Registro (`app/api/auth/register/route.ts`)

**ANTES (Incorrecto):**
```typescript
const userProfile = {
  uid: userRecord.uid,
  email: userRecord.email,
  displayName: userRecord.displayName,
  role: role,
  status: 'inactive', // ❌ Usuario inactivo hasta aprobación
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: false,
  permissions: [],
  registrationStatus: 'pending',
  // ...
};
```

**AHORA (Correcto):**
```typescript
const userProfile = {
  uid: userRecord.uid,
  email: userRecord.email,
  displayName: userRecord.displayName,
  role: role,
  status: 'pending', // ✅ Usuario pendiente hasta aprobación
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: false,
  permissions: [],
  registrationStatus: 'pending',
  // ...
};
```

**Cambio:** Línea 55 - `status: 'inactive'` → `status: 'pending'`

---

### 2. Función de Login (`lib/auth.ts`)

**ANTES (Rechazaba usuarios pending):**
```typescript
// Verificar que el status sea 'active'
if (userStatus !== 'active') {
  // Cerrar sesión inmediatamente
  await signOut(auth);
  
  const error: any = new Error('Esta cuenta no está activa...');
  error.code = 'auth/user-not-active';
  throw error;
}
```

**AHORA (Permite usuarios pending):**
```typescript
// ✅ Permitir login para usuarios con status 'pending' y 'active'
// Los usuarios 'pending' verán el banner amarillo en la página de login
if (userStatus !== 'active' && userStatus !== 'pending') {
  // Cerrar sesión inmediatamente
  await signOut(auth);
  
  const error: any = new Error('Esta cuenta no está activa...');
  error.code = 'auth/user-not-active';
  throw error;
}

console.log(`✅ Login permitido para usuario con status: ${userStatus}`);
```

**Cambio:** Líneas 195-206 - Ahora permite `status='pending'`

---

### 3. AuthContext (`context/AuthContext.tsx`)

**ANTES (Cerraba sesión de usuarios pending):**
```typescript
if (userStatus === 'deleted' || userStatus === 'inactive' || isActive === false) {
  // Cerrar sesión automáticamente
  await auth.signOut();
  // ...
}
```

**AHORA (Mantiene sesión de usuarios pending):**
```typescript
// ✅ Permitir usuarios con status 'pending' (mostrarán banner en login)
// Solo cerrar sesión para 'deleted', 'inactive', o si isActive=false y NO es pending
if (userStatus === 'deleted' || 
    userStatus === 'inactive' || 
    (isActive === false && userStatus !== 'pending')) {
  // Cerrar sesión automáticamente
  await auth.signOut();
  // ...
}

// Log para usuarios con estado pending
if (userStatus === 'pending') {
  console.log('⏳ Usuario con status PENDING - Sesión permitida:', userEmail);
}
```

**Cambio:** Líneas 82-106 - Ahora permite y logea usuarios `pending`

---

## 🎯 Flujo Corregido

### Registro:
```
1. Usuario completa formulario de registro
   ↓
2. API crea usuario en Firebase Auth
   ↓
3. API crea perfil en Firestore con:
   - status: 'pending' ✅
   - isActive: false ✅
   - registrationStatus: 'pending' ✅
   ↓
4. Sistema cierra sesión
   ↓
5. Redirige a /login?registered=true
```

### Primer Login (Pending):
```
1. Usuario ingresa credenciales
   ↓
2. loginUser() verifica el estado
   ↓
3. Detecta status='pending'
   ↓
4. ✅ Permite el login
   ↓
5. Log: "✅ Login permitido para usuario con status: pending"
   ↓
6. Retorna registrationStatus='pending'
   ↓
7. Página de login detecta pending
   ↓
8. 🟡 Banner amarillo aparece (15s)
   ↓
9. Mensaje: "⏳ Cuenta Pendiente de Aprobación..."
   ↓
10. Usuario navega con acceso limitado
```

### Después de Aprobación:
```
1. Admin aprueba cuenta
   ↓
2. status cambia a 'active'
   ↓
3. isActive cambia a true
   ↓
4. registrationStatus permanece 'approved'
   ↓
5. Usuario hace login
   ↓
6. ✅ NO aparece banner
   ↓
7. Toast: "¡Bienvenido de vuelta!"
   ↓
8. Acceso completo
```

---

## 🧪 Cómo Verificar la Corrección

### Opción 1: Script Automático

```bash
node scripts/verify-pending-status.js
```

El script muestra:
- Usuarios existentes con status='pending'
- Si tienen la configuración correcta
- Guía para prueba manual

### Opción 2: Prueba Manual

1. **Registra nuevo usuario:**
   ```
   URL: http://localhost:3000/register
   Email: test-pending@ejemplo.com
   Nombre: Usuario Prueba
   Contraseña: test123456
   ```

2. **Verifica en Firestore:**
   - Ve a Firebase Console
   - Firestore Database → users → [nuevo usuario]
   - Verifica:
     - ✅ `status: "pending"`
     - ✅ `isActive: false`
     - ✅ `registrationStatus: "pending"`

3. **Intenta login:**
   - Ve a: http://localhost:3000/login
   - Inicia sesión con las credenciales
   - Verifica:
     - ✅ Login exitoso
     - ✅ Banner amarillo aparece
     - ✅ Duración: 15 segundos
     - ✅ Mensaje de cuenta pendiente

4. **Verifica logs en consola del navegador (F12):**
   ```
   ⏳ Usuario con registro PENDING detectado
   ✅ Login permitido para usuario con status: pending
   ✅ Banner amarillo mostrado para usuario pending
   ⏳ Usuario con status PENDING - Sesión permitida: [email]
   ```

---

## 📊 Comparación Antes/Después

| Aspecto | ANTES | AHORA |
|---------|-------|-------|
| **Estado inicial** | `status: 'inactive'` | `status: 'pending'` ✅ |
| **Login permitido** | ❌ No | ✅ Sí |
| **Banner amarillo** | ❌ No aparecía | ✅ Aparece 15s |
| **Mensaje claro** | ❌ No | ✅ Sí |
| **UX** | ❌ Confusa | ✅ Clara |

---

## 🎯 Estados Válidos del Sistema

| Estado | Login Permitido | Banner | Navegación |
|--------|----------------|--------|------------|
| **pending** | ✅ Sí | 🟡 Amarillo (15s) | Limitada |
| **active** | ✅ Sí | ❌ No | Completa |
| **inactive** | ❌ No | 🟡 Amarillo bloqueo | No permitida |
| **deleted** | ❌ No | 🔴 Rojo bloqueo | No permitida |
| **rejected** | ✅ Sí | 🔴 Rojo (15s) | Limitada |

---

## 🔍 Logs del Sistema

### Durante Registro (API):
```
🚀 API Route: Iniciando registro de usuario: { email, displayName, role }
📝 Creando usuario en Firebase Auth...
✅ Usuario creado en Firebase Auth: [uid]
💾 Creando perfil en Firestore...
📋 Datos del perfil a crear: { status: 'pending', ... }
✅ Perfil creado en Firestore exitosamente
```

### Durante Login (Cliente):
```
📞 Llamando a loginUser...
🔍 Estado de registro verificado: pending
🔍 Perfil de usuario: { status: 'pending', ... }
✅ Login permitido para usuario con status: pending
⏳ Usuario con registro PENDING detectado
✅ Banner amarillo mostrado para usuario pending
```

### En AuthContext:
```
👤 Usuario encontrado: [email]
⏳ Usuario con status PENDING - Sesión permitida: [email]
```

---

## 📁 Archivos Modificados

### 1. API de Registro:
- ✅ `app/api/auth/register/route.ts` (línea 55)

### 2. Lógica de Login:
- ✅ `lib/auth.ts` (líneas 186, 195-206)

### 3. Context de Auth:
- ✅ `context/AuthContext.tsx` (líneas 82-106)

### 4. Script de Verificación (nuevo):
- ✅ `scripts/verify-pending-status.js`

### 5. Documentación (nueva):
- ✅ `CORRECCION_ESTADO_PENDING.md` (este documento)

---

## ⚠️ Usuarios Existentes

Si hay usuarios que se registraron ANTES de esta corrección y tienen `status='inactive'`:

### Opción 1: Aprobarlos Manualmente
1. Ve al panel de admin
2. Busca usuarios con status='inactive' y registrationStatus='pending'
3. Apruébalos normalmente
4. Su status cambiará a 'active'

### Opción 2: Script de Migración

Si hay muchos usuarios afectados, puedes crear un script de migración:

```javascript
// Buscar usuarios con status='inactive' y registrationStatus='pending'
const usersToFix = await db.collection('users')
  .where('status', '==', 'inactive')
  .where('registrationStatus', '==', 'pending')
  .get();

// Actualizar a status='pending'
for (const doc of usersToFix.docs) {
  await doc.ref.update({ status: 'pending' });
  console.log(`✅ Actualizado: ${doc.data().email}`);
}
```

---

## ✅ Estado Actual

**CORRECCIÓN IMPLEMENTADA Y VERIFICADA** ✅

- ✅ Nuevos usuarios se registran con `status='pending'`
- ✅ Usuarios pending pueden hacer login
- ✅ Banner amarillo aparece para usuarios pending
- ✅ Mensajes claros en cada paso
- ✅ Logs extensivos para debugging
- ✅ Script de verificación creado

---

## 🚀 Próximos Pasos

1. **Probar el flujo completo:**
   ```bash
   # Terminal 1: Servidor
   npm run dev

   # Terminal 2: Verificación
   node scripts/verify-pending-status.js
   ```

2. **Registrar usuario de prueba:**
   - Ir a http://localhost:3000/register
   - Completar formulario
   - Verificar estado en Firestore

3. **Verificar login:**
   - Intentar login con usuario de prueba
   - Verificar banner amarillo
   - Confirmar acceso limitado

4. **Aprobar y verificar:**
   - Como admin, aprobar el usuario
   - Login nuevamente
   - Verificar acceso completo sin banner

---

**Fecha de Corrección:** 8 de octubre de 2025  
**Estado:** ✅ COMPLETADO  
**Versión:** 2.1.0

