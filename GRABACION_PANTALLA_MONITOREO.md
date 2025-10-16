# Grabación de Pantalla - Centro de Monitoreo

## 📹 Funcionalidad Implementada

Se ha agregado un sistema completo de grabación de pantalla específicamente para la página de monitoreo administrativo (`/admin/monitoring`).

## 🎯 Características

### Botón de Grabación
- **Ubicación**: Header de la página de monitoreo
- **Icono**: Monitor (inactivo) / Square (grabando)
- **Estados**: 
  - Gris: Listo para grabar
  - Rojo con animación: Grabando activamente

### Funcionalidades
- ✅ Grabación de pantalla completa o ventana específica
- ✅ Incluye audio del sistema (si está disponible)
- ✅ Formato WebM con codec VP9 para mejor compresión
- ✅ Descarga automática del video al finalizar
- ✅ Indicadores visuales durante la grabación
- ✅ Limpieza automática de recursos

## 🎨 Indicadores Visuales

### Banner Superior
Cuando se está grabando, aparece un banner rojo en la parte superior:
```
🔴 GRABACIÓN DE PANTALLA ACTIVA - Presiona el botón de stop para finalizar
```

### Indicador en Header
Badge rojo junto al título "Centro de Monitoreo":
- **Desktop**: "GRABANDO PANTALLA"
- **Mobile**: "REC"

### Botón Animado
El botón cambia de color y tiene animación de pulso cuando está grabando.

## 🚀 Cómo Usar

1. **Iniciar Grabación**:
   - Haz clic en el botón del monitor en el header
   - Selecciona qué pantalla/ventana grabar en el popup del navegador
   - La grabación comenzará automáticamente

2. **Durante la Grabación**:
   - Aparecerán indicadores visuales
   - El botón cambiará a cuadrado rojo con animación
   - Puedes continuar usando la aplicación normalmente

3. **Finalizar Grabación**:
   - Haz clic en el botón cuadrado rojo
   - O cierra la ventana de captura del navegador
   - El video se descargará automáticamente

## 📁 Archivos de Video

- **Formato**: `.webm`
- **Codec**: VP9
- **Nombre**: `screen_recording_YYYY-MM-DDTHH-mm-ss.webm`
- **Calidad**: 1920x1080 a 30 FPS (ideal)
- **Audio**: Incluido si está disponible

## 🔧 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 72+
- ✅ Firefox 66+
- ✅ Edge 79+
- ✅ Safari 13+ (limitado)

### Requisitos
- HTTPS o localhost (requerido para getDisplayMedia)
- Permisos de captura de pantalla
- API MediaRecorder soportada

## 🛡️ Seguridad

- Solo disponible en la página de monitoreo (`/admin/monitoring`)
- Requiere permisos de administrador
- No se almacenan videos en servidor
- Descarga directa al dispositivo del usuario

## 🎛️ Configuración Técnica

### Parámetros de Grabación
```javascript
{
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 }
  },
  audio: true
}
```

### MediaRecorder
```javascript
{
  mimeType: 'video/webm;codecs=vp9'
}
```

## 🐛 Manejo de Errores

- **Navegador no compatible**: Mensaje informativo
- **Permisos denegados**: Alert con instrucciones
- **Error durante grabación**: Notificación y limpieza automática
- **Stream terminado**: Detección automática y finalización

## 📱 Responsive Design

- **Desktop**: Indicadores completos con texto
- **Mobile**: Indicadores compactos
- **Tablet**: Adaptación automática

## 🔄 Limpieza de Recursos

- URLs de objetos revocadas automáticamente
- Streams de media detenidos al desmontar componente
- Chunks de grabación limpiados después de descarga
- Prevención de memory leaks

## 🎯 Casos de Uso

1. **Documentar Incidentes**: Grabar eventos importantes en tiempo real
2. **Capacitación**: Crear videos tutoriales del sistema
3. **Auditoría**: Registrar sesiones de monitoreo
4. **Reportes**: Generar evidencias visuales
5. **Troubleshooting**: Capturar problemas del sistema

## ⚡ Rendimiento

- **Optimización**: Grabación en chunks de 1 segundo
- **Compresión**: Codec VP9 para archivos más pequeños
- **Memoria**: Limpieza automática de recursos
- **CPU**: Impacto mínimo durante la grabación

---

**Nota**: Esta funcionalidad está disponible únicamente en la página de monitoreo administrativo y requiere permisos de administrador para acceder.

