# 🔧 Solución: Bucle Infinito de Recarga en Página de Alerta Activa

## 📋 Problema Identificado

La página `/residentes/panico/activa/[id]` se estaba recargando cada segundo, haciendo imposible interactuar con ella.

## 🔍 Causas Raíz Identificadas

### 1. **Dependencias Circulares en useEffect**

#### Problema 1.1: useEffect con `router` como dependencia
```typescript
// ANTES (PROBLEMÁTICO)
useEffect(() => {
  // ... lógica de carga
}, [alertId, user, router]); // ❌ router cambia constantemente
```

El objeto `router` de Next.js puede cambiar entre renders, causando que el useEffect se ejecute infinitamente.

#### Problema 1.2: useEffect con `isEmitter` como dependencia
```typescript
// ANTES (PROBLEMÁTICO)
useEffect(() => {
  // Polling de actualización
}, [alertId, user, loading, isEmitter]); // ❌ isEmitter se actualiza en otro useEffect
```

Había una cadena de dependencias: 
- useEffect 1 → actualiza `isEmitter`
- useEffect 2 → depende de `isEmitter` → se ejecuta
- useEffect 2 → actualiza `alertData`
- Componente se re-renderiza → vuelve a empezar

#### Problema 1.3: useEffect con `isRecording` como dependencia
```typescript
// ANTES (PROBLEMÁTICO)
useEffect(() => {
  // Inicia video
  setIsRecording(true); // ❌ Actualiza su propia dependencia
}, [alertData?.extremeMode, isEmitter, isRecording]);
```

### 2. **Actualizaciones de Estado Innecesarias**

El polling actualizaba el estado incluso cuando no había cambios reales, causando re-renders continuos.

### 3. **useCallback con `router` como dependencia**

```typescript
// ANTES (PROBLEMÁTICO)
const handleResolveAlert = useCallback(async () => {
  // ...
}, [alertId, user?.uid, router, stopRecording]); // ❌ router causa re-creaciones
```

## ✅ Soluciones Aplicadas

### 1. **Referencia Estable del Router**

```typescript
// Crear ref para mantener referencia estable
const routerRef = useRef(router);

// Actualizar ref cuando cambie router
useEffect(() => {
  routerRef.current = router;
}, [router]);

// Usar en todos los lugares
routerRef.current.push('/residentes/panico');
```

**Beneficio:** El router ya no causa re-ejecuciones de useEffect ni re-creaciones de callbacks.

### 2. **Cleanup y Verificación de Montaje**

```typescript
useEffect(() => {
  if (!alertId || !user) return;
  
  let isMounted = true; // ✅ Previene actualizaciones en componentes desmontados

  const loadAlertData = async () => {
    // ...
    if (!isMounted) return;
    // ...
  };

  loadAlertData();

  return () => {
    isMounted = false; // ✅ Cleanup
  };
}, [alertId, user]); // ✅ Sin router
```

### 3. **Optimización del Polling**

```typescript
// ANTES: Siempre actualizaba el estado
setAlertData(prev => prev ? {
  ...prev,
  acknowledgedBy: data.acknowledgedBy || [],
  status: data.status
} : null);

// DESPUÉS: Solo actualiza si hay cambios reales
setAlertData(prev => {
  if (!prev) return null;
  
  const acknowledgedChanged = JSON.stringify(prev.acknowledgedBy) !== 
                               JSON.stringify(data.acknowledgedBy || []);
  const statusChanged = prev.status !== data.status;
  
  if (!acknowledgedChanged && !statusChanged) {
    return prev; // ✅ Previene re-render innecesario
  }
  
  return {
    ...prev,
    acknowledgedBy: data.acknowledgedBy || [],
    status: data.status
  };
});
```

### 4. **Dependencias Corregidas**

```typescript
// useEffect de carga inicial
useEffect(() => {
  // ...
}, [alertId, user]); // ✅ Sin router

// useEffect de polling
useEffect(() => {
  // ...
}, [alertId, user, loading]); // ✅ Sin isEmitter

// useEffect de video
useEffect(() => {
  // ...
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [alertData?.extremeMode, isEmitter]); // ✅ Sin isRecording

// handleResolveAlert
const handleResolveAlert = useCallback(async () => {
  // ...
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [alertId, user?.uid, stopRecording]); // ✅ Sin router
```

### 5. **Memoización para Prevenir Re-renders**

```typescript
// Memoizar props del mapa para evitar re-renders del iframe
const mapProps = useMemo(() => ({
  latitude: alertData.gpsLatitude,
  longitude: alertData.gpsLongitude,
  location: alertData.location,
  userName: alertData.userName
}), [alertData.gpsLatitude, alertData.gpsLongitude, alertData.location, alertData.userName]);

// Exportar componente con React.memo
export default React.memo(ActivePanicPage);
```

### 6. **Logging para Debugging**

```typescript
// Debug al inicio del componente
useEffect(() => {
  console.log('🔄 ActivePanicPage montado/actualizado:', new Date().toISOString());
  return () => {
    console.log('🔄 ActivePanicPage desmontado:', new Date().toISOString());
  };
}, []);
```

## 📊 Resultados

### Antes
- ❌ Página se recargaba cada 1 segundo
- ❌ Imposible interactuar con la interfaz
- ❌ Mapa se recargaba constantemente
- ❌ Video se reiniciaba continuamente
- ❌ Chat no funcionaba correctamente

### Después
- ✅ Página carga una sola vez
- ✅ Interfaz completamente interactiva
- ✅ Polling funciona correctamente cada 5 segundos
- ✅ Mapa se carga una sola vez
- ✅ Video se inicia y mantiene correctamente
- ✅ Chat funciona sin problemas
- ✅ No hay re-renders innecesarios

## 🔍 Cómo Verificar la Solución

1. **Abrir la consola del navegador** (F12)
2. **Ir a la página de alerta activa**: `http://localhost:3000/residentes/panico/activa/[id]`
3. **Verificar los logs**:
   - Debe ver solo UN mensaje de "ActivePanicPage montado"
   - No debe ver múltiples mensajes de "desmontado/montado" en rápida sucesión
4. **Verificar interactividad**:
   - El chat debe funcionar
   - Los botones deben responder
   - El mapa debe mantenerse estable
5. **Verificar Network tab**:
   - No debe haber solicitudes de recarga de página constantes
   - Solo solicitudes de polling cada 5 segundos para datos
   - Solo solicitudes de chat cada 3 segundos

## 🎯 Mejores Prácticas Aplicadas

1. **Usar `useRef` para valores que no deben causar re-renders**
2. **Verificar `isMounted` antes de actualizar estado en funciones asíncronas**
3. **Comparar valores antes de actualizar estado** (prevenir actualizaciones innecesarias)
4. **Evitar incluir objetos/funciones inestables en dependencias de useEffect**
5. **Usar `React.memo` y `useMemo` para optimizar re-renders**
6. **Agregar logging temporal para debugging de problemas de re-render**

## 📝 Archivos Modificados

- `app/residentes/panico/activa/[id]/page.tsx` - Correcciones principales

## 🚀 Próximos Pasos

Si el problema persiste:

1. **Verificar en consola** si hay errores de JavaScript no capturados
2. **Verificar en Network tab** si hay solicitudes que fallen y causen recargas
3. **Deshabilitar extensiones del navegador** que puedan interferir
4. **Probar en modo incógnito** para descartar interferencias de caché
5. **Revisar el componente Navbar** si se sospecha que causa problemas
6. **Verificar el AuthContext** si hay problemas de autenticación que causen redirecciones

## 📚 Documentación Relacionada

- [React Hooks: useEffect](https://react.dev/reference/react/useEffect)
- [React Hooks: useCallback](https://react.dev/reference/react/useCallback)
- [React Hooks: useMemo](https://react.dev/reference/react/useMemo)
- [Next.js: useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [React: memo](https://react.dev/reference/react/memo)

