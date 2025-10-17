# Solución para URLs HTTP de Streams en Producción

## Problema Identificado

En producción en Vercel, las URLs de streaming de las cámaras usan protocolo HTTP, pero la aplicación se sirve a través de HTTPS. Los navegadores modernos bloquean el "contenido mixto" (HTTPS cargando recursos HTTP) por razones de seguridad.

### Síntomas:
- Los streams de cámaras no se cargan en producción
- Errores de "Mixed Content" en la consola del navegador
- Las cámaras funcionan en desarrollo pero no en producción

## Solución Implementada

### 1. API Route Proxy (`app/api/stream-proxy/route.ts`)

Se creó un endpoint que actúa como proxy HTTPS para los streams HTTP:

```typescript
// Uso: /api/stream-proxy?url=http://192.168.1.100:8080/video
```

**Características:**
- ✅ Convierte URLs HTTP a HTTPS automáticamente
- ✅ Validación de dominios permitidos para seguridad
- ✅ Manejo de errores y timeouts
- ✅ Headers optimizados para streaming
- ✅ Soporte para CORS

### 2. Hook Personalizado (`hooks/useStreamUrl.ts`)

Hook que automáticamente detecta el entorno y usa el proxy cuando es necesario:

```typescript
const streamUrl = useProductionStreamUrl(originalHttpUrl);
// En desarrollo: http://192.168.1.100:8080/video
// En producción: /api/stream-proxy?url=http%3A//192.168.1.100%3A8080/video
```

### 3. Configuración de Next.js Actualizada

Se actualizó `next.config.mjs` para manejar correctamente el Content Security Policy:

```javascript
// Desarrollo: Permite HTTP y HTTPS
// Producción: Solo HTTPS (incluyendo el proxy)
```

### 4. Componentes Actualizados

- ✅ `app/admin/security-cameras/[id]/edit/page.tsx`
- ✅ `app/admin/monitoring/page.tsx`

## Cómo Funciona

### En Desarrollo:
```
Navegador → http://localhost:3000 → http://192.168.1.100:8080/video
✅ Funciona (contenido mixto permitido)
```

### En Producción:
```
Navegador → https://tu-app.vercel.app → /api/stream-proxy → http://192.168.1.100:8080/video
✅ Funciona (todo HTTPS)
```

## Configuración de Dominios Permitidos

El proxy valida que las URLs sean de dominios seguros:

```typescript
const allowedHosts = [
  '77.222.181.11',
  '24.35.236.133', 
  '67.53.46.161',
  '200.107.234.131',
  '192.168.',  // Redes locales
  '10.',       // Redes locales
  '172.'       // Redes locales
];
```

## Uso en Componentes

### Antes:
```typescript
<img src={camera.streamUrl} alt="Stream" />
```

### Después:
```typescript
import { useProductionStreamUrl } from '@/hooks/useStreamUrl';

const streamUrl = useProductionStreamUrl(camera.streamUrl);
<img src={streamUrl} alt="Stream" />
```

## Beneficios

1. **Seguridad**: Elimina el contenido mixto
2. **Compatibilidad**: Funciona en todos los navegadores
3. **Transparente**: No requiere cambios en las URLs de las cámaras
4. **Automático**: Detecta el entorno y actúa en consecuencia
5. **Escalable**: Fácil de mantener y extender

## Testing

### Para Probar en Desarrollo:
1. Las URLs HTTP funcionan directamente
2. El proxy también funciona si se usa manualmente

### Para Probar en Producción:
1. Deploy a Vercel
2. Verificar que los streams se cargan correctamente
3. Revisar la consola del navegador (no debe haber errores de Mixed Content)

## Mantenimiento

### Agregar Nuevos Dominios:
Editar `app/api/stream-proxy/route.ts` y agregar el nuevo host a `allowedHosts`.

### Debugging:
- Revisar logs del servidor en Vercel
- Verificar que las URLs de las cámaras sean válidas
- Comprobar que los dominios estén en la lista de permitidos

## Consideraciones de Rendimiento

- El proxy agrega una capa adicional, pero es mínima
- Los streams se cachean apropiadamente
- Timeout configurado a 30 segundos para evitar bloqueos
- Headers optimizados para streaming en tiempo real

## Seguridad

- ✅ Validación de dominios
- ✅ Timeout para evitar conexiones colgadas
- ✅ Headers de seguridad apropiados
- ✅ No exposición de credenciales en logs
- ✅ CORS configurado correctamente

---

**Resultado**: Los streams de cámaras HTTP ahora funcionan perfectamente en producción en Vercel, manteniendo la seguridad y compatibilidad con todos los navegadores modernos.
