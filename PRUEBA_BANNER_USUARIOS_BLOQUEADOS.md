# 🧪 Prueba: Banner Amarillo para Usuarios Bloqueados

## ✅ Mejoras Implementadas

### Problema Identificado
El banner amarillo no aparecía o desaparecía inmediatamente cuando un usuario bloqueado/desactivado/eliminado intentaba iniciar sesión.

**Causa Raíz:**
- Cuando se detectaba un usuario bloqueado, se ejecutaba `signOut()` antes de mostrar el banner
- Esto causaba re-renders del `AuthProvider` que podían limpiar el estado de las alertas
- El `sessionStorage` se limpiaba demasiado rápido, antes de que el componente se re-montara

### Solución Implementada

#### 1. **Persistencia Mejorada en sessionStorage**
- Ahora `showAlert` guarda INMEDIATAMENTE en `sessionStorage` **ANTES** de actualizar el estado
- Esto asegura que la alerta esté disponible incluso si el componente se desmonta

```typescript
// En context/GlobalAlertContext.tsx - líneas 126-142
if (persist && typeof window !== 'undefined') {
  // Guardar ANTES del setState
  const existingAlerts = JSON.parse(sessionStorage.getItem('globalAlerts') || '[]');
  const updatedAlerts = [...existingAlerts, newAlert];
  sessionStorage.setItem('globalAlerts', JSON.stringify(updatedAlerts));
  console.log('💾 ✅ Guardado en sessionStorage ANTES del setState');
}
```

#### 2. **Carga Inteligente desde sessionStorage**
- El `useEffect` ahora verifica que no agregue alertas duplicadas
- No limpia el `sessionStorage` inmediatamente, permitiendo múltiples re-mounts
- Cada alerta se limpia individualmente cuando se cierra

```typescript
// En context/GlobalAlertContext.tsx - líneas 55-68
setAlerts(prev => {
  // Solo agregar alertas que no estén ya en el estado
  const newAlerts = parsed.filter((newAlert: AlertMessage) => 
    !prev.some(existingAlert => existingAlert.id === newAlert.id)
  );
  
  if (newAlerts.length > 0) {
    return [...prev, ...newAlerts];
  }
  
  return prev;
});
```

#### 3. **Limpieza Inteligente**
- Las alertas se limpian del `sessionStorage` cuando se cierran (no antes)
- Si hay múltiples re-mounts rápidos, la alerta persiste hasta que expire su tiempo

## 🧪 Cómo Probar

### Prerequisito: Crear Usuario Bloqueado

Ejecuta uno de estos scripts para crear/bloquear un usuario de prueba:

```bash
# Opción 1: Desactivar usuario existente
node scripts/test-blocked-user-login.js

# Opción 2: Usar script de bloqueo
node scripts/test-blocked-access.js
```

Estos scripts crearán o actualizarán un usuario con:
- Email: `test-blocked@example.com`
- Password: `TestPass123!`
- Status: `inactive`
- isActive: `false`

### Prueba 1: Login con Usuario Bloqueado (Desactivado)

1. **Ve a la página de login:**
   ```
   http://localhost:3000/login
   ```

2. **Ingresa credenciales del usuario bloqueado:**
   - Email: `test-blocked@example.com`
   - Password: `TestPass123!`

3. **Haz click en "Iniciar Sesión"**

4. **VERIFICA:**
   - ✅ Aparece un banner amarillo en la parte superior
   - ✅ El banner dice: "🚫 Acceso Denegado: Esta cuenta ha sido desactivada. Contacta al administrador para más información."
   - ✅ El banner tiene un icono de advertencia (⚠️)
   - ✅ El banner tiene un botón X para cerrar
   - ✅ El banner tiene una barra de progreso en la parte inferior
   - ✅ El banner permanece visible durante **5 segundos completos**
   - ✅ El banner NO desaparece cuando cambia el estado de autenticación

### Prueba 2: Verificar Persistencia en Consola

1. **Abre DevTools (F12) → Console**

2. **Limpia la consola (Ctrl+L)**

3. **Intenta iniciar sesión con usuario bloqueado**

4. **BUSCA estos logs:**

```javascript
// 1. Detección de usuario bloqueado
🚨🚨🚨 USUARIO BLOQUEADO DETECTADO 🚨🚨🚨
📝 Mensaje de error: ...

// 2. Llamada a showAlert
🔔🔔🔔 showAlert LLAMADO 🔔🔔🔔
📝 Mensaje: 🚫 Acceso Denegado...
🎨 Tipo: warning
⏱️ Duración: 5000
💾 Persistir: true

// 3. Guardado en sessionStorage
💾 ✅ Guardado en sessionStorage ANTES del setState: 1 alertas

// 4. Carga desde sessionStorage (si hubo re-mount)
📦 Cargando alertas persistidas desde sessionStorage: 1
📋 Alertas cargadas: [{...}]

// 5. Banner se muestra
🎨 GlobalAlertBanner RENDER
📊 Total alertas: 1
✨ Renderizando 1 alertas

// 6. Auto-cierre después de 5 segundos
⏰ Auto-cerrando alerta cargada: [id]
🗑️ Alerta removida de sessionStorage: [id]
```

### Prueba 3: Verificar sessionStorage

1. **Abre DevTools (F12) → Application → Session Storage**

2. **Selecciona tu dominio (localhost:3000)**

3. **INMEDIATAMENTE después de hacer click en "Iniciar Sesión":**
   - Deberías ver una clave `globalAlerts`
   - Con un array JSON que contiene la alerta

4. **Después de 5 segundos:**
   - La clave `globalAlerts` debería desaparecer o estar vacía

### Prueba 4: Usuario Eliminado

Si tienes un usuario con `status: 'deleted'`:

1. **Intenta iniciar sesión con ese usuario**

2. **El banner debe decir:**
   ```
   🚫 Acceso Denegado: Esta cuenta ha sido eliminada. 
   Contacta al administrador si crees que es un error.
   ```

3. **Todo lo demás debe funcionar igual que en Prueba 1**

## 🎨 Apariencia Esperada del Banner

```
┌──────────────────────────────────────────────────────────┐
│ ⚠️  🚫 Acceso Denegado: Esta cuenta ha sido          ❌  │
│     desactivada. Contacta al administrador para          │
│     más información.                                     │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░ (barra de progreso)       │
└──────────────────────────────────────────────────────────┘

                ↓ Página de Login ↓
```

**Características visuales:**
- Fondo amarillo claro (`bg-yellow-50`)
- Borde izquierdo amarillo (`border-yellow-400`)
- Texto amarillo oscuro (`text-yellow-800`)
- Icono circular con fondo amarillo (`bg-yellow-100`)
- Barra de progreso amarilla que se reduce de 100% a 0%
- Sombra (`shadow-lg`)
- Animación de entrada (desliza desde arriba)

## ❓ Troubleshooting

### Problema: El banner no aparece

**Verificar:**

1. **¿El usuario está realmente bloqueado?**
   ```javascript
   // En Firebase Console → Firestore → users → [usuario]
   {
     "status": "inactive",  // o "deleted"
     "isActive": false
   }
   ```

2. **¿Las credenciales son correctas?**
   - El banner solo aparece si el email Y password son correctos
   - Si el password es incorrecto, verás un toast de error normal

3. **¿Hay errores en la consola?**
   - Busca errores en rojo
   - Verifica que no haya errores de TypeScript

4. **¿El servidor está corriendo?**
   ```bash
   npm run dev
   ```

### Problema: El banner aparece pero desaparece inmediatamente

**Esto ya no debería suceder**, pero si sucede:

1. **Verifica los logs:**
   - ¿Aparece "💾 ✅ Guardado en sessionStorage"?
   - ¿Aparece "📦 Cargando alertas persistidas"?

2. **Verifica sessionStorage:**
   - DevTools → Application → Session Storage
   - ¿Está la clave `globalAlerts`?

3. **Reinicia el servidor:**
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

4. **Limpia el caché:**
   - Ctrl+Shift+R (recarga forzada)
   - O usa modo incógnito

### Problema: El banner se queda para siempre

Si el banner no se cierra automáticamente:

1. **Verifica el timeout:**
   - Busca en la consola: "⏰ Auto-cerrando alerta"
   - Debería aparecer después de 5 segundos

2. **Cierra manualmente:**
   - Click en el botón X

3. **Limpia sessionStorage manualmente:**
   ```javascript
   // En la consola del navegador
   sessionStorage.removeItem('globalAlerts');
   ```

## 📝 Checklist de Verificación

- [ ] Banner aparece cuando usuario bloqueado intenta login
- [ ] Banner es de color amarillo
- [ ] Banner muestra mensaje específico de bloqueo
- [ ] Banner permanece visible durante 5 segundos completos
- [ ] Banner NO desaparece cuando se ejecuta signOut()
- [ ] Banner tiene icono de advertencia (⚠️)
- [ ] Banner tiene botón X para cerrar
- [ ] Banner tiene barra de progreso
- [ ] Log "💾 ✅ Guardado en sessionStorage" aparece
- [ ] Log "📦 Cargando alertas persistidas" aparece (si hay re-mount)
- [ ] sessionStorage contiene la alerta inmediatamente después de login
- [ ] sessionStorage se limpia después de que el banner se cierra
- [ ] El banner funciona consistentemente en múltiples intentos

## 🔧 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `context/GlobalAlertContext.tsx` | • Guardar en sessionStorage ANTES del setState<br>• Carga inteligente sin duplicados<br>• Limpieza individual por alerta<br>• Logs mejorados |
| `app/login/page.tsx` | Ya tenía `persist: true` implementado |
| `lib/auth.ts` | Ya tenía detección de usuarios bloqueados |

## ✅ Resultado Esperado

**ANTES (problema):**
- Banner aparece brevemente ❌
- Desaparece con el signOut() ❌
- Usuario no ve el mensaje ❌

**AHORA (solución):**
- Banner aparece ✅
- Persiste durante 5 segundos completos ✅
- Usuario VE y ENTIENDE por qué no puede iniciar sesión ✅

## 🚀 Siguiente Paso

Una vez que hayas verificado que el banner funciona correctamente:

1. **Prueba con diferentes tipos de usuarios:**
   - Usuario con `status: 'inactive'`
   - Usuario con `status: 'deleted'`
   - Usuario con `isActive: false`

2. **Prueba en diferentes navegadores:**
   - Chrome
   - Firefox
   - Edge

3. **Prueba escenarios edge cases:**
   - Intentar login múltiples veces rápidamente
   - Cambiar de página mientras el banner está visible
   - Cerrar el banner manualmente

4. **Si todo funciona → Listo! ✅**

---

**Fecha:** 8 de octubre de 2025  
**Estado:** ✅ IMPLEMENTADO - LISTO PARA PROBAR  
**Versión:** 4.0.0 (persistencia mejorada)

