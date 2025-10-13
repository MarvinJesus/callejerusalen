# 🔧 CORRECCIÓN: Bucle Infinito de Re-renders

## 🐛 Problema

La página `/residentes/panico/activa/[id]` se recargaba infinitamente cada segundo, causando un bucle de renders.

### Síntomas
```
Página carga
↓ (1 segundo)
Página se recarga
↓ (1 segundo)
Página se recarga
↓ (continúa infinitamente)
```

---

## 🔍 Causa Raíz

El problema estaba en las **dependencias de los `useEffect`**:

### useEffect del Contador de Tiempo

**ANTES** ❌:
```typescript
useEffect(() => {
  // Actualizar contador cada segundo
  const interval = setInterval(updateTime, 1000);
  return () => clearInterval(interval);
}, [alertData]); // ❌ PROBLEMA AQUÍ
```

**Problema**: 
- `alertData` es un objeto completo que cambia constantemente
- Cada vez que `onSnapshot` actualiza `alertData`, se recrea el intervalo
- Esto causa un re-render infinito

### useEffect del Video

**ANTES** ❌:
```typescript
useEffect(() => {
  if (!alertData?.extremeMode || isRecording || !isEmitter) return;
  
  startVideoRecording();
  
  return () => {
    if (stream) { // ❌ PROBLEMA: stream no está en dependencias
      stream.getTracks().forEach(track => track.stop());
    }
  };
}, [alertData?.extremeMode]); // ❌ Falta isRecording e isEmitter
```

**Problemas**:
- Condición usa `isRecording` e `isEmitter` pero no están en dependencias
- Cleanup usa `stream` pero no está en dependencias
- Causa comportamiento impredecible

---

## ✅ Solución

### 1. Corregir Contador de Tiempo

**AHORA** ✅:
```typescript
useEffect(() => {
  if (!alertData || !alertData.expiresAt) return;

  const expiresAt = alertData.expiresAt; // Guardamos en constante
  
  const updateTime = () => {
    const now = new Date();
    const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    // ... actualizar tiempo
  };

  updateTime();
  const interval = setInterval(updateTime, 1000);
  return () => clearInterval(interval);
}, [alertData?.expiresAt]); // ✅ Solo depende de expiresAt
```

**Mejora**:
- Solo depende de `alertData?.expiresAt`
- No se recrea el intervalo innecesariamente
- El intervalo corre independientemente de otros cambios

### 2. Separar useEffect del Video

**AHORA** ✅:
```typescript
// useEffect 1: Iniciar video
useEffect(() => {
  if (!alertData?.extremeMode || !isEmitter) return;
  if (isRecording) return; // Ya está grabando
  
  const startVideoRecording = async () => {
    // ... iniciar video
  };
  
  startVideoRecording();
}, [alertData?.extremeMode, isEmitter, isRecording]); // ✅ Todas las dependencias

// useEffect 2: Cleanup del video (separado)
useEffect(() => {
  return () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
}, [stream]); // ✅ Cleanup depende de stream
```

**Mejoras**:
- Todas las dependencias declaradas correctamente
- Cleanup separado en su propio `useEffect`
- No causa re-renders innecesarios

---

## 📊 Comparación

| Aspecto | ANTES ❌ | AHORA ✅ |
|---------|----------|----------|
| **Dependencias** | Incorrectas | Correctas |
| **Re-renders** | Infinitos | Solo cuando necesario |
| **Contador** | Se recrea cada segundo | Estable |
| **Video** | Comportamiento impredecible | Comportamiento estable |
| **Rendimiento** | Muy bajo | Óptimo |

---

## 🎯 Reglas Aprendidas

### 1. Dependencias Mínimas
```typescript
// ❌ MAL
useEffect(() => {
  // ...
}, [alertData]); // Todo el objeto

// ✅ BIEN
useEffect(() => {
  // ...
}, [alertData?.expiresAt]); // Solo la propiedad necesaria
```

### 2. Separar Efectos
```typescript
// ❌ MAL - Un useEffect con múltiples responsabilidades
useEffect(() => {
  startSomething();
  return () => stopSomething();
}, [dep1, dep2, dep3]);

// ✅ BIEN - Efectos separados
useEffect(() => {
  startSomething();
}, [dep1, dep2]);

useEffect(() => {
  return () => stopSomething();
}, [dep3]);
```

### 3. Verificar Todas las Dependencias
```typescript
// ❌ MAL
useEffect(() => {
  if (condition1 && condition2) { // Usa condition1 y condition2
    doSomething();
  }
}, [condition1]); // ❌ Falta condition2

// ✅ BIEN
useEffect(() => {
  if (condition1 && condition2) {
    doSomething();
  }
}, [condition1, condition2]); // ✅ Todas incluidas
```

---

## 🧪 Cómo Verificar la Solución

### 1. Abrir DevTools
```
F12 → Console
```

### 2. Observar Logs
```
ANTES ❌:
✅ Video iniciado correctamente
⏱️ Actualizando tiempo: 9:45
⏱️ Actualizando tiempo: 9:44
⏱️ Actualizando tiempo: 9:43
🔄 Recargando página...  ← ❌ BUCLE
✅ Video iniciado correctamente
⏱️ Actualizando tiempo: 9:45
...

AHORA ✅:
✅ Video iniciado correctamente
⏱️ Actualizando tiempo: 9:45
⏱️ Actualizando tiempo: 9:44
⏱️ Actualizando tiempo: 9:43
... (continúa sin recargar) ← ✅ CORRECTO
```

### 3. Verificar Contador
- El contador debe actualizar cada segundo
- La página NO debe recargarse
- El video NO debe reiniciarse

---

## 📝 Archivos Modificados

1. ✅ `app/residentes/panico/activa/[id]/page.tsx`
   - Línea ~180-203: Corregir useEffect del contador
   - Línea ~205-262: Separar useEffect del video

---

## 🚀 Resultado

✅ **La página ya NO se recarga infinitamente**  
✅ **El contador funciona correctamente**  
✅ **El video se inicia una sola vez**  
✅ **Rendimiento óptimo**  

---

## 💡 Lección Clave

> **Siempre usa las dependencias mínimas necesarias en useEffect**
> 
> Si usas un objeto completo como `alertData`, cualquier cambio en cualquier propiedad causará que se ejecute el efecto.
> 
> Mejor usar propiedades específicas como `alertData?.expiresAt`

---

**Estado**: ✅ Corregido  
**Compilación**: ✅ Exitosa  
**Listo para usar**: Sí

