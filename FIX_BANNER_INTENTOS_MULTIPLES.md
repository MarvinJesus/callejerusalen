# 🔧 Fix: Banner No Aparecía en Intentos Múltiples

## 🐛 Bug Reportado por el Usuario

**Síntoma:** El banner amarillo se mostraba la PRIMERA vez que un usuario bloqueado intentaba login, pero en intentos posteriores (segunda, tercera vez, etc.) el banner NO aparecía.

## 🔍 Causa Raíz Identificada

### Problema Original

En la implementación anterior, usábamos un `loadedRef` (línea 40) para evitar cargar alertas duplicadas:

```typescript
const loadedRef = React.useRef(false);

useEffect(() => {
  // ❌ PROBLEMA: Solo cargaba UNA VEZ
  if (loadedRef.current) {
    console.log('ℹ️ Alertas ya cargadas, saltando carga duplicada');
    return; // ❌ Salía inmediatamente en intentos posteriores
  }
  
  // Código de carga...
  loadedRef.current = true; // ❌ Marcaba como cargado PERMANENTEMENTE
}, [hideAlert]);
```

### ¿Por qué Fallaba?

**Primer intento (FUNCIONABA):**
1. Usuario bloqueado intenta login
2. `showAlert()` guarda en sessionStorage
3. `useEffect` se ejecuta (`loadedRef.current === false`)
4. Alerta se carga y se muestra ✅
5. `loadedRef.current = true`
6. Después de 5 segundos, alerta se cierra

**Segundo intento (FALLABA):**
1. Usuario bloqueado intenta login OTRA VEZ
2. `showAlert()` guarda en sessionStorage ✅
3. `useEffect` se ejecuta (`loadedRef.current === true`) ❌
4. **¡Sale inmediatamente sin cargar nada!** ❌
5. Banner NO aparece ❌

## ✅ Solución Implementada

### 1. Cambio de `loadedRef` a `loadedIdsRef` con Set

**ANTES:**
```typescript
const loadedRef = React.useRef(false); // ❌ Boolean global
```

**AHORA:**
```typescript
const loadedIdsRef = React.useRef<Set<string>>(new Set()); // ✅ Set de IDs
```

**Ventaja:** Ahora trackeamos CUÁLES alertas hemos cargado (por ID), no solo si "ya cargamos algo".

### 2. Agregar `storageVersion` para Forzar Re-ejecución

**AHORA:**
```typescript
const [storageVersion, setStorageVersion] = useState(0);

useEffect(() => {
  // Se ejecuta cada vez que storageVersion cambia
  // ...
}, [hideAlert, storageVersion]); // ✅ storageVersion incluido
```

**Ventaja:** Cada vez que guardamos una alerta, incrementamos `storageVersion`, lo que fuerza al `useEffect` a ejecutarse.

### 3. Filtrar Solo Alertas NO Cargadas

**AHORA:**
```typescript
// Filtrar solo las alertas que NO hemos cargado antes
const newAlerts = parsed.filter((alert: AlertMessage) => 
  !loadedIdsRef.current.has(alert.id) // ✅ Verifica ID específico
);

if (newAlerts.length === 0) {
  console.log('ℹ️ No hay alertas nuevas para cargar');
  return;
}

// Marcar estos IDs como cargados
newAlerts.forEach((alert: AlertMessage) => {
  loadedIdsRef.current.add(alert.id); // ✅ Agrega solo el ID de esta alerta
});
```

**Ventaja:** Solo cargamos alertas que NO hemos visto antes.

### 4. Incrementar `storageVersion` al Guardar

**AHORA:**
```typescript
if (persist && typeof window !== 'undefined') {
  // Guardar en sessionStorage...
  sessionStorage.setItem('globalAlerts', JSON.stringify(updatedAlerts));
  
  // ✅ Incrementar storageVersion para forzar re-carga
  setStorageVersion(prev => prev + 1);
  console.log('🔄 StorageVersion incrementado para forzar re-carga');
}
```

**Ventaja:** Cada vez que guardamos una alerta, el `useEffect` se ejecuta automáticamente.

### 5. Limpiar ID al Cerrar Alerta

**AHORA:**
```typescript
const hideAlert = useCallback((id: string) => {
  console.log('🗑️ hideAlert llamado para:', id);
  setAlerts(prev => prev.filter(alert => alert.id !== id));
  
  // ✅ También remover del set de IDs cargados
  loadedIdsRef.current.delete(id);
}, []);
```

**Ventaja:** Si la misma alerta aparece de nuevo en el futuro, se puede cargar.

## 🎯 Flujo Mejorado

### Primer Intento

```
Usuario bloqueado intenta login (1er intento)
  ↓
showAlert() se llama con persist=true
  ↓
Guarda en sessionStorage
  ↓
setStorageVersion(0 → 1) // ✅ Incrementa
  ↓
useEffect se ejecuta (storageVersion cambió)
  ↓
Verifica loadedIdsRef: {} (vacío)
  ↓
Carga alerta con ID "abc123"
  ↓
loadedIdsRef.add("abc123")
  ↓
Banner VISIBLE 5 segundos ✅
  ↓
hideAlert("abc123")
  ↓
loadedIdsRef.delete("abc123")
```

### Segundo Intento (AHORA FUNCIONA)

```
Usuario bloqueado intenta login (2do intento)
  ↓
showAlert() se llama con persist=true
  ↓
Guarda en sessionStorage (nueva alerta ID "xyz789")
  ↓
setStorageVersion(1 → 2) // ✅ Incrementa de nuevo
  ↓
useEffect se ejecuta (storageVersion cambió) // ✅ Se ejecuta!
  ↓
Verifica loadedIdsRef: {} (ya no tiene "abc123", se limpió)
  ↓
Encuentra nueva alerta "xyz789"
  ↓
loadedIdsRef.add("xyz789")
  ↓
Banner VISIBLE 5 segundos ✅ // ✅ FUNCIONA!
  ↓
hideAlert("xyz789")
  ↓
loadedIdsRef.delete("xyz789")
```

## 📊 Comparación: Antes vs. Ahora

| Característica | ANTES (❌) | AHORA (✅) |
|----------------|-----------|-----------|
| Primera vez | ✅ Funciona | ✅ Funciona |
| Segunda vez | ❌ No aparece | ✅ Funciona |
| Tercera vez | ❌ No aparece | ✅ Funciona |
| N veces | ❌ No aparece | ✅ Funciona |
| Tracking | Boolean global | Set de IDs |
| Re-ejecución | Solo al montar | Cada storageVersion |
| Duplicados | Previene todo | Previene por ID |

## 🧪 Cómo Probar el Fix

### Prueba: Intentos Múltiples de Login

1. **Abre el navegador:**
   ```
   http://localhost:3000/login
   ```

2. **Abre la Consola (F12)**

3. **Intenta login con usuario bloqueado:**
   - Email: `test-blocked@example.com`
   - Password: `TestPass123!`

4. **Verifica que el banner aparece** ✅

5. **Espera 5 segundos** (hasta que el banner desaparezca)

6. **Intenta login OTRA VEZ** (segundo intento)

7. **¡El banner DEBE aparecer de nuevo!** ✅

8. **Repite varias veces** (3, 4, 5 intentos)

9. **El banner debe aparecer CADA VEZ** ✅

### Logs Esperados (Cada Intento)

```javascript
// Intento 1
🔔🔔🔔 showAlert LLAMADO 🔔🔔🔔
💾 ✅ Guardado en sessionStorage ANTES del setState: 1 alertas
🔄 StorageVersion incrementado para forzar re-carga // ✅ NUEVO
📦 Verificando alertas en sessionStorage: 1
📋 Alertas nuevas encontradas: 1
➕ Agregando 1 alertas nuevas al estado
✨ Renderizando 1 alertas

// (Espera 5 segundos)

⏰ Auto-cerrando alerta cargada: [id]
🗑️ SessionStorage limpiado

// Intento 2 (AHORA FUNCIONA)
🔔🔔🔔 showAlert LLAMADO 🔔🔔🔔
💾 ✅ Guardado en sessionStorage ANTES del setState: 1 alertas
🔄 StorageVersion incrementado para forzar re-carga // ✅ Se ejecuta de nuevo
📦 Verificando alertas en sessionStorage: 1
📋 Alertas nuevas encontradas: 1 // ✅ Detecta la nueva alerta
➕ Agregando 1 alertas nuevas al estado
✨ Renderizando 1 alertas // ✅ FUNCIONA!

// Intento 3, 4, 5... (TODOS FUNCIONAN)
```

## ✅ Cambios en el Código

### `context/GlobalAlertContext.tsx`

**Línea 40:**
```typescript
// ANTES: const loadedRef = React.useRef(false);
// AHORA:
const [storageVersion, setStorageVersion] = useState(0);
const loadedIdsRef = React.useRef<Set<string>>(new Set());
```

**Línea 43-48:**
```typescript
const hideAlert = useCallback((id: string) => {
  console.log('🗑️ hideAlert llamado para:', id);
  setAlerts(prev => prev.filter(alert => alert.id !== id));
  // ✅ NUEVO: También remover del set de IDs cargados
  loadedIdsRef.current.delete(id);
}, []);
```

**Línea 52-68:**
```typescript
useEffect(() => {
  // ❌ ANTES: if (loadedRef.current) return;
  
  // ✅ AHORA: Filtrar solo alertas NO cargadas
  const newAlerts = parsed.filter((alert: AlertMessage) => 
    !loadedIdsRef.current.has(alert.id)
  );
  
  if (newAlerts.length === 0) {
    return;
  }
  
  // Marcar IDs como cargados
  newAlerts.forEach((alert: AlertMessage) => {
    loadedIdsRef.current.add(alert.id);
  });
  
  // ...
}, [hideAlert, storageVersion]); // ✅ storageVersion agregado
```

**Línea 162-164:**
```typescript
// ✅ NUEVO: Incrementar storageVersion
setStorageVersion(prev => prev + 1);
console.log('🔄 StorageVersion incrementado para forzar re-carga');
```

## 🎯 Resultado Final

### ANTES (Problema)
```
Intento 1: ✅ Banner aparece
Intento 2: ❌ Banner NO aparece
Intento 3: ❌ Banner NO aparece
Intento N: ❌ Banner NO aparece
```

### AHORA (Solucionado)
```
Intento 1: ✅ Banner aparece
Intento 2: ✅ Banner aparece
Intento 3: ✅ Banner aparece
Intento N: ✅ Banner aparece
```

## ✅ Checklist de Verificación

- [ ] Banner aparece en el 1er intento
- [ ] Banner aparece en el 2do intento ← **CRÍTICO**
- [ ] Banner aparece en el 3er intento
- [ ] Banner aparece en el 4to intento
- [ ] Banner aparece en el 5to intento
- [ ] Log "🔄 StorageVersion incrementado" aparece cada vez
- [ ] Log "📋 Alertas nuevas encontradas" aparece cada vez
- [ ] Banner permanece 5 segundos en cada intento
- [ ] No hay alertas duplicadas

## 🚨 Si Todavía No Funciona

**Verificar en la consola:**
1. ¿Aparece "🔄 StorageVersion incrementado"?
2. ¿Aparece "📦 Verificando alertas en sessionStorage"?
3. ¿Aparece "📋 Alertas nuevas encontradas"?

**Si NO aparece "Alertas nuevas encontradas":**
- Puede ser que el ID sea el mismo
- Verifica que cada alerta tenga un ID único

**Si aparece pero no se muestra:**
- Problema de renderizado en `GlobalAlertBanner`
- Verifica que no haya errores de CSS/z-index

**Limpiar todo y reintentar:**
```javascript
// En consola del navegador
sessionStorage.clear();
location.reload();
```

---

**Fecha:** 8 de octubre de 2025  
**Estado:** ✅ IMPLEMENTADO - LISTO PARA RE-PROBAR  
**Fix:** Cambio de `loadedRef` (boolean) a `loadedIdsRef` (Set) + `storageVersion`  
**Reportado por:** Usuario (feedback inmediato) 🙏

