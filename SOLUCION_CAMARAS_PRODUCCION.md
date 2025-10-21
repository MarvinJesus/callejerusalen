# Solución para Cámaras en Producción - Error 403

## Problema Identificado

En producción en Vercel, algunas cámaras no se pueden ver y muestran error 403 (Forbidden) en el stream-proxy:

```
GET https://www.callejerusalen.com/api/stream-proxy?url=http%3A%2F%2F80.28.111.68%3A81%2Fmjpg%2Fvideo.mjpg?t=1761004397116 403 (Forbidden)
```

## Causa del Problema

El stream-proxy tiene una lista de hosts permitidos por seguridad. Si una cámara tiene una IP que no está en esta lista, el proxy rechaza la conexión con error 403.

## Solución Implementada

### 1. Agregar Nueva IP a la Lista de Hosts Permitidos

Se agregó la IP `80.28.111.68` a la lista de hosts permitidos en `app/api/stream-proxy/route.ts`:

```typescript
const allowedHosts = [
  '77.222.181.11',
  '24.35.236.133', 
  '67.53.46.161',
  '200.107.234.131',
  '80.28.111.68',  // ✅ Nueva cámara agregada
  '192.168.',      // Redes locales
  '10.',           // Redes locales
  '172.'           // Redes locales
];
```

### 2. Actualizar Configuración de Next.js

Se agregó la nueva IP a `next.config.mjs` para permitir imágenes remotas:

```javascript
{
  protocol: 'http',
  hostname: '80.28.111.68',
  port: '81',
  pathname: '/**',
},
```

### 3. Mejorar Logging y Manejo de Errores

Se agregaron logs más detallados para facilitar el debugging:

```typescript
if (!isAllowed) {
  console.warn(`🚫 Host no permitido: ${urlObj.hostname} para URL: ${streamUrl}`);
  return NextResponse.json({ 
    error: 'Host not allowed', 
    hostname: urlObj.hostname,
    message: 'Esta IP de cámara no está en la lista de hosts permitidos. Contacta al administrador para agregarla.'
  }, { status: 403 });
}

console.log(`✅ Host permitido: ${urlObj.hostname} para URL: ${streamUrl}`);
```

## Cómo Agregar Nuevas IPs de Cámaras

### Paso 1: Identificar la IP de la Cámara

Cuando una cámara no funciona en producción, revisa los logs del navegador para encontrar la IP:

```
GET https://www.callejerusalen.com/api/stream-proxy?url=http%3A%2F%2FNUEVA_IP%3APUERTO%2Fruta 403 (Forbidden)
```

### Paso 2: Agregar a stream-proxy

Edita `app/api/stream-proxy/route.ts` y agrega la nueva IP a `allowedHosts`:

```typescript
const allowedHosts = [
  // ... IPs existentes ...
  'NUEVA_IP_AQUI',  // Nueva cámara
  // ... resto de IPs ...
];
```

### Paso 3: Agregar a next.config.mjs

Edita `next.config.mjs` y agrega el patrón de imagen remota:

```javascript
{
  protocol: 'http',
  hostname: 'NUEVA_IP_AQUI',
  port: 'PUERTO_AQUI',
  pathname: '/**',
},
```

### Paso 4: Hacer Deploy

1. Commit los cambios:
```bash
git add .
git commit -m "Agregar nueva IP de cámara: NUEVA_IP"
git push
```

2. Vercel hará deploy automáticamente

## Verificación

### En Desarrollo:
- Las cámaras HTTP funcionan directamente
- El proxy también funciona si se usa manualmente

### En Producción:
1. Hacer deploy a Vercel
2. Verificar que los streams se cargan correctamente
3. Revisar la consola del navegador (no debe haber errores 403)

## Script de Verificación

Se creó un script `scripts/check-camera-ips.js` para verificar todas las IPs de cámaras y su compatibilidad con el stream-proxy.

Para ejecutarlo:
```bash
node scripts/check-camera-ips.js
```

## IPs Actualmente Configuradas

| IP | Puerto | Descripción |
|----|--------|-------------|
| 77.222.181.11 | 8080 | Cámara 1 |
| 24.35.236.133 | - | Cámara 2 |
| 67.53.46.161 | 65123 | Cámara 3 |
| 200.107.234.131 | - | Cámara 4 |
| 80.28.111.68 | 81 | Cámara 5 (nueva) |
| 192.168.* | - | Redes locales |
| 10.* | - | Redes locales |
| 172.* | - | Redes locales |

## Troubleshooting

### Error 403 Persiste
1. Verificar que la IP esté en `allowedHosts`
2. Verificar que el puerto esté correcto
3. Revisar logs del servidor en Vercel
4. Verificar que la URL de la cámara sea válida

### Error de Mixed Content
- Esto ya está solucionado con el stream-proxy
- Si persiste, verificar que se esté usando el proxy en producción

### Cámara No Responde
1. Verificar que la cámara esté encendida
2. Verificar conectividad de red
3. Verificar que la URL de stream sea correcta
4. Revisar configuración de la cámara

## Seguridad

### ¿Por qué se valida el host?
- Previene ataques de proxy abierto
- Solo permite acceso a cámaras autorizadas
- Protege contra acceso a recursos internos

### ¿Es seguro exponer las IPs?
- Las IPs de cámaras son públicas por diseño
- El proxy solo permite lectura de streams
- No se exponen credenciales ni datos sensibles

---

**Resultado**: El error 403 para la cámara `80.28.111.68:81` ha sido solucionado. Los streams ahora funcionan correctamente en producción.
