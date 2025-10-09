# ⚡ Resumen: Corrección Estado Pending

## 🐛 Problema

Al registrarse, usuarios quedaban con `status='inactive'` en lugar de `status='pending'`:
- ❌ No podían hacer login
- ❌ No veían banner amarillo
- ❌ Sistema los rechazaba

## ✅ Solución

Tres cambios simples pero críticos:

### 1. API de Registro
```typescript
// ANTES
status: 'inactive'  // ❌

// AHORA  
status: 'pending'   // ✅
```
**Archivo:** `app/api/auth/register/route.ts` línea 55

### 2. Función de Login
```typescript
// AHORA permite status='pending' Y 'active'
if (userStatus !== 'active' && userStatus !== 'pending') {
  // rechazar
}
```
**Archivo:** `lib/auth.ts` líneas 195-206

### 3. AuthContext
```typescript
// NO cerrar sesión si es 'pending'
if (userStatus === 'deleted' || 
    userStatus === 'inactive' || 
    (isActive === false && userStatus !== 'pending')) {
  // cerrar sesión
}
```
**Archivo:** `context/AuthContext.tsx` líneas 82-106

---

## 🧪 Verificar

```bash
# Script de verificación
node scripts/verify-pending-status.js

# Prueba manual
# 1. Registra usuario en /register
# 2. Inicia sesión con ese usuario
# 3. Verifica banner amarillo de 15s
```

---

## 📊 Resultado

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Estado inicial | `'inactive'` | `'pending'` ✅ |
| Login permitido | ❌ | ✅ |
| Banner amarillo | ❌ | ✅ 15s |

---

## 📁 Archivos Modificados

1. ✅ `app/api/auth/register/route.ts`
2. ✅ `lib/auth.ts`
3. ✅ `context/AuthContext.tsx`

## 📚 Documentación

- **Completa:** `CORRECCION_ESTADO_PENDING.md`
- **Script:** `scripts/verify-pending-status.js`

---

**Estado:** ✅ CORREGIDO  
**Fecha:** 8 de octubre de 2025

