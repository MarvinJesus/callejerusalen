# 📝 Mensajes de Error de Login Detallados

## 🎯 Objetivo

Cada error de login ahora tiene un mensaje **específico, claro y accionable** que le indica al usuario:
1. **Qué pasó** - El problema exacto
2. **Por qué pasó** - La razón del error
3. **Qué hacer** - Acción recomendada

---

## 📊 Mensajes por Estado de Cuenta

### 1. ⏳ Cuenta Pendiente (`status='pending'`)

**Error Code:** `auth/user-pending`  
**Tipo de Banner:** 🟡 Amarillo (warning)  
**Duración:** 25 segundos

**Mensaje Completo:**
```
⏳ Cuenta Pendiente de Aprobación: Tu registro ha sido recibido 
correctamente. Un administrador debe aprobar tu cuenta antes de 
que puedas iniciar sesión. Este proceso suele tomar 24-48 horas. 
Recibirás un correo electrónico cuando tu cuenta sea aprobada.
```

**Cuándo aparece:**
- Usuario se registró recientemente
- Su cuenta aún no ha sido aprobada por un administrador
- `status` en Firestore es `'pending'`

**Qué puede hacer el usuario:**
- ⏳ Esperar 24-48 horas
- 📧 Revisar su email para notificación de aprobación
- ☎️ Contactar al administrador si tarda más de 48 horas

---

### 2. 🚫 Cuenta Desactivada (`status='inactive'`)

**Error Code:** `auth/user-disabled`  
**Tipo de Banner:** 🟡 Amarillo (warning)  
**Duración:** 20 segundos

**Mensaje Completo:**
```
🚫 Cuenta Desactivada: Tu cuenta ha sido desactivada por un 
administrador. Esto puede deberse a inactividad o violación de 
políticas. Contacta al administrador para obtener más información 
y solicitar la reactivación.
```

**Cuándo aparece:**
- Administrador desactivó la cuenta manualmente
- Usuario violó términos de servicio
- Cuenta inactiva por mucho tiempo
- `status` en Firestore es `'inactive'` o `isActive` es `false`

**Qué puede hacer el usuario:**
- ☎️ Contactar al administrador
- 📧 Enviar email solicitando información
- 🔄 Solicitar reactivación si fue un error

---

### 3. 🚫 Cuenta Eliminada (`status='deleted'`)

**Error Code:** `auth/user-deleted`  
**Tipo de Banner:** 🔴 Rojo (error)  
**Duración:** 20 segundos

**Mensaje Completo:**
```
🚫 Cuenta Eliminada: Esta cuenta ha sido eliminada del sistema. 
Si crees que esto es un error, contacta al administrador para 
solicitar la reactivación de tu cuenta.
```

**Cuándo aparece:**
- Administrador eliminó la cuenta permanentemente
- Usuario solicitó eliminación de su cuenta
- `status` en Firestore es `'deleted'`

**Qué puede hacer el usuario:**
- ☎️ Contactar al administrador
- 🔄 Solicitar recuperación si fue un error
- 📝 Registrarse nuevamente si fue intencional

---

### 4. ❌ Estado de Cuenta Inválido (otros estados)

**Error Code:** `auth/user-not-active`  
**Tipo de Banner:** 🟡 Amarillo (warning)  
**Duración:** 15 segundos

**Mensaje Completo:**
```
❌ Estado de Cuenta Inválido: Tu cuenta tiene un estado no válido 
([estado]). Contacta al administrador para resolver este problema.
```

**Cuándo aparece:**
- `status` tiene un valor inesperado (no 'active', 'pending', 'inactive', 'deleted')
- Corrupción de datos
- Migración incompleta

**Qué puede hacer el usuario:**
- ☎️ Contactar al administrador inmediatamente
- 📝 Reportar el estado inválido

---

## 📊 Mensajes de Errores de Autenticación

### 5. ❌ Usuario no encontrado

**Error Code:** `auth/user-not-found`  
**Tipo:** Toast (no banner)

**Mensaje:**
```
❌ Usuario no encontrado: No existe una cuenta registrada con 
este email. Verifica tu email o regístrate si aún no tienes cuenta.
```

**Acción del usuario:**
- ✅ Verificar que el email esté correcto
- 📝 Registrarse si es nuevo usuario

---

### 6. ❌ Contraseña incorrecta

**Error Code:** `auth/wrong-password`  
**Tipo:** Toast (no banner)

**Mensaje:**
```
❌ Contraseña incorrecta: La contraseña ingresada no es correcta. 
Verifica tu contraseña o usa "¿Olvidaste tu contraseña?" para 
recuperarla.
```

**Acción del usuario:**
- 🔑 Verificar que la contraseña sea correcta
- 🔄 Usar recuperación de contraseña si la olvidó

---

### 7. ❌ Email inválido

**Error Code:** `auth/invalid-email`  
**Tipo:** Toast (no banner)

**Mensaje:**
```
❌ Email inválido: El formato del email no es válido. Verifica 
que esté escrito correctamente.
```

**Acción del usuario:**
- ✅ Verificar formato del email (debe contener @)
- ✅ Revisar que no haya espacios

---

### 8. ⚠️ Demasiados intentos

**Error Code:** `auth/too-many-requests`  
**Tipo:** Toast (no banner)

**Mensaje:**
```
⚠️ Demasiados intentos fallidos: Por seguridad, tu acceso ha 
sido temporalmente bloqueado. Espera unos minutos e intenta 
nuevamente.
```

**Acción del usuario:**
- ⏱️ Esperar 5-15 minutos
- 🔄 Intentar nuevamente
- 🔑 Usar recuperación de contraseña si la olvidó

---

## 🎨 Formato de Mensajes

### Estructura de cada mensaje:

```
[Emoji] [Título del Error]: [Explicación del problema]. 
[Contexto adicional si es necesario]. 
[Acción recomendada para el usuario].
```

### Emojis por Tipo:

- ⏳ **Pendiente** - Proceso en curso
- 🚫 **Bloqueado** - Acceso denegado
- ❌ **Error** - Problema técnico o de datos
- ⚠️ **Advertencia** - Precaución temporal

---

## 📊 Tipos de Notificación

| Tipo de Error | Notificación | Duración | Color | Cierre Manual |
|---------------|-------------|----------|-------|---------------|
| **Pending** | Banner | 25s | 🟡 Amarillo | ✅ |
| **Desactivada** | Banner | 20s | 🟡 Amarillo | ✅ |
| **Eliminada** | Banner | 20s | 🔴 Rojo | ✅ |
| **Estado inválido** | Banner | 15s | 🟡 Amarillo | ✅ |
| **Password incorrecta** | Toast | 5s | 🔴 | ❌ |
| **Usuario no encontrado** | Toast | 5s | 🔴 | ❌ |
| **Email inválido** | Toast | 5s | 🔴 | ❌ |
| **Demasiados intentos** | Toast | 5s | 🟡 | ❌ |

---

## 🔍 Orden de Verificación

**Importancia del orden:** Las verificaciones se ejecutan en este orden específico:

```
1. Super Admin (siempre permitido) 👑
   ↓
2. Cuenta Eliminada (deleted) 🚫
   ↓
3. Cuenta Pendiente (pending) ⏳
   ↓
4. Cuenta Desactivada (inactive) 🚫
   ↓
5. Estado Inválido (cualquier otro) ❌
   ↓
6. ✅ Login Exitoso (active)
```

**Por qué este orden:**
1. **Super admin primero** - Protección máxima
2. **Deleted segundo** - Estado más crítico
3. **Pending tercero** - Tiene `isActive=false` pero mensaje diferente
4. **Inactive cuarto** - Solo después de verificar pending
5. **Otros estados** - Catch-all para casos no esperados

---

## 🧪 Prueba de Mensajes

### Script de Verificación:

```bash
node scripts/verify-pending-status.js
```

### Prueba Manual:

#### Probar "Pending":
1. Registra usuario nuevo
2. Intenta login inmediatamente
3. **Verifica mensaje:**
   ```
   ⏳ Cuenta Pendiente de Aprobación: Tu registro ha sido 
   recibido correctamente. Un administrador debe aprobar...
   ```

#### Probar "Desactivada":
1. Como admin, desactiva un usuario
2. Intenta login con ese usuario
3. **Verifica mensaje:**
   ```
   🚫 Cuenta Desactivada: Tu cuenta ha sido desactivada 
   por un administrador. Esto puede deberse a...
   ```

#### Probar "Eliminada":
1. Como admin, elimina un usuario
2. Intenta login con ese usuario
3. **Verifica mensaje:**
   ```
   🚫 Cuenta Eliminada: Esta cuenta ha sido eliminada 
   del sistema. Si crees que esto es un error...
   ```

#### Probar "Password incorrecta":
1. Usa usuario válido
2. Ingresa password incorrecta
3. **Verifica toast:**
   ```
   ❌ Contraseña incorrecta: La contraseña ingresada 
   no es correcta. Verifica tu contraseña o usa...
   ```

---

## 📋 Checklist de Mensajes

Verifica que cada mensaje:
- [ ] Tiene emoji apropiado
- [ ] Tiene título claro
- [ ] Explica QUÉ pasó
- [ ] Explica POR QUÉ pasó
- [ ] Indica QUÉ HACER
- [ ] Es respetuoso y profesional
- [ ] Tiene duración apropiada
- [ ] Usa el tipo correcto (banner vs toast)

---

## 🎯 Beneficios

### Para el Usuario:
- ✅ **Claridad total** - Sabe exactamente qué pasó
- ✅ **Acción clara** - Sabe qué hacer
- ✅ **Tiempo suficiente** - Puede leer el mensaje completo
- ✅ **No confusión** - Cada estado tiene mensaje único

### Para Soporte:
- ✅ **Menos tickets** - Usuarios tienen información clara
- ✅ **Autoservicio** - Muchos problemas se resuelven solos
- ✅ **Mensajes consistentes** - Fácil de referenciar en documentación

---

## 📁 Archivos Modificados

### 1. `lib/auth.ts`
- Mensajes más descriptivos para cada estado
- Orden correcto de verificaciones
- Comentarios explicativos

### 2. `app/login/page.tsx`
- Mensajes detallados para todos los errores
- Duraciones apropiadas por tipo
- Tipo de banner correcto (warning/error)

---

## 📚 Guía de Referencia Rápida

| Estado | Código Error | Mensaje Corto | Banner | Duración |
|--------|-------------|---------------|--------|----------|
| **Pending** | `auth/user-pending` | Cuenta pendiente | 🟡 | 25s |
| **Inactive** | `auth/user-disabled` | Cuenta desactivada | 🟡 | 20s |
| **Deleted** | `auth/user-deleted` | Cuenta eliminada | 🔴 | 20s |
| **Invalid** | `auth/user-not-active` | Estado inválido | 🟡 | 15s |
| **Not Found** | `auth/user-not-found` | Usuario no existe | Toast | 5s |
| **Wrong Pass** | `auth/wrong-password` | Password incorrecta | Toast | 5s |
| **Invalid Email** | `auth/invalid-email` | Email inválido | Toast | 5s |
| **Too Many** | `auth/too-many-requests` | Bloqueado temp. | Toast | 5s |

---

**Fecha de Implementación:** 8 de octubre de 2025  
**Estado:** ✅ COMPLETADO  
**Versión:** 2.2.1

