# Vista Maximizada de Cámaras - Centro de Monitoreo

## 📺 Funcionalidad Implementada

Se ha agregado un sistema completo de vista maximizada para cada cámara individual en la página de monitoreo administrativo (`/admin/monitoring`).

## 🎯 Características

### Botón de Maximizar
- **Ubicación**: Aparece al pasar el mouse sobre cada stream de cámara
- **Icono**: Maximize2 (expandir)
- **Posición**: En el overlay de controles junto al botón de grabación
- **Tooltip**: "Maximizar cámara"

### Vista Maximizada
- ✅ **Modal de pantalla completa**: Ocupa toda la pantalla
- ✅ **Stream en alta resolución**: Vista optimizada del video
- ✅ **Controles integrados**: Grabación y pantalla completa
- ✅ **Información detallada**: Nombre, descripción, estado, tiempo
- ✅ **Indicadores visuales**: Estado de grabación y conversión
- ✅ **Navegación intuitiva**: Botón cerrar y tecla ESC

## 🎨 Diseño de la Vista Maximizada

### Header Superior
```
[←] Centro de Monitoreo | [👁] Nombre Cámara [Estado] | [Hora] [Grabar] [Maximizar]
```

**Elementos del Header**:
- **Botón Volver**: Cierra la vista maximizada
- **Título**: Nombre de la cámara con icono
- **Estado**: Badge con color según estado (activa/inactiva/etc.)
- **Tiempo**: Hora y fecha actual
- **Controles**: Grabación y pantalla completa

### Área de Video
- **Fondo**: Negro completo
- **Video**: Centrado con `object-contain` para mantener proporciones
- **Resolución**: Máxima calidad disponible del stream

### Footer Inferior
```
Nombre Cámara
Descripción de la cámara
[WiFi] En línea | [Clock] Última actualización: HH:MM:SS
```

### Indicadores de Estado
- **Grabando**: Badge rojo con animación en esquina superior izquierda
- **Convirtiendo**: Badge azul con spinner en esquina superior derecha

## 🚀 Funcionalidades

### 1. Maximizar Cámara
```javascript
// Al hacer clic en el botón de maximizar
onClick={() => maximizeCamera(camera)}
```

### 2. Controles en Vista Maximizada
- **Grabación**: Mismo sistema que en vista normal
- **Pantalla Completa**: Maximiza el video dentro del modal
- **Cerrar**: Botón X o tecla ESC

### 3. Navegación
- **Tecla ESC**: Cierra la vista maximizada
- **Botón Volver**: Cierra y regresa a la vista normal
- **Click fuera**: No cierra (evita cierres accidentales)

## 🎛️ Controles Disponibles

### Botón de Grabación
- **Estado Normal**: Círculo rojo (iniciar grabación)
- **Estado Grabando**: Cuadrado blanco con animación (detener)
- **Funcionalidad**: Idéntica a la vista normal

### Botón de Pantalla Completa
- **Función**: Maximiza el video dentro del modal
- **Compatibilidad**: Chrome, Firefox, Edge, Safari
- **Fallbacks**: webkit y ms para navegadores antiguos

## 📱 Responsive Design

### Desktop
- **Modal**: Pantalla completa
- **Header**: Controles completos con tooltips
- **Footer**: Información detallada

### Mobile/Tablet
- **Adaptación**: Responsive automático
- **Controles**: Optimizados para touch
- **Texto**: Tamaños adaptativos

## 🔧 Implementación Técnica

### Estados
```typescript
const [maximizedCamera, setMaximizedCamera] = useState<Camera | null>(null);
```

### Funciones Principales
```typescript
const maximizeCamera = (camera: Camera) => {
  setMaximizedCamera(camera);
};

const closeMaximizedCamera = () => {
  setMaximizedCamera(null);
};
```

### Event Listeners
```typescript
// Tecla ESC para cerrar
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && maximizedCamera) {
      closeMaximizedCamera();
    }
  };
  // ...
}, [maximizedCamera]);
```

## 🎯 Casos de Uso

### 1. Monitoreo Detallado
- Examinar eventos específicos en alta resolución
- Analizar detalles que no son visibles en vista reducida
- Enfocar atención en una cámara específica

### 2. Grabación Precisa
- Grabar eventos importantes en máxima calidad
- Control preciso del inicio/fin de grabación
- Vista clara del estado de grabación

### 3. Presentaciones
- Mostrar streams a múltiples personas
- Pantalla completa para auditorios
- Vista profesional para reportes

### 4. Troubleshooting
- Diagnosticar problemas de cámaras
- Verificar calidad de streams
- Inspeccionar configuraciones visuales

## 🛡️ Seguridad y Permisos

- **Acceso**: Solo administradores
- **Página**: Exclusivamente en `/admin/monitoring`
- **Persistencia**: No se almacena estado entre sesiones
- **Privacidad**: Modal se cierra al navegar

## ⚡ Rendimiento

### Optimizaciones
- **Lazy Loading**: Modal solo se renderiza cuando está activo
- **Event Listeners**: Se limpian automáticamente
- **Memory Management**: No acumula referencias
- **DOM Updates**: Mínimos re-renders

### Compatibilidad
- **Navegadores**: Chrome, Firefox, Edge, Safari
- **Dispositivos**: Desktop, tablet, móvil
- **Resoluciones**: Adaptable a cualquier tamaño

## 🎨 Estilos CSS

### Modal
```css
fixed inset-0 bg-black z-50 flex flex-col
```

### Video
```css
w-full h-full object-contain
```

### Controles
```css
bg-gray-700 hover:bg-gray-600 rounded-full transition-colors
```

## 🔄 Flujo de Usuario

1. **Acceder**: Ir a `/admin/monitoring`
2. **Hover**: Pasar mouse sobre cualquier cámara
3. **Maximizar**: Hacer clic en el botón de maximizar
4. **Usar**: Interactuar con controles en vista maximizada
5. **Cerrar**: Presionar ESC o botón volver

## 🐛 Manejo de Errores

- **Stream no disponible**: Muestra mensaje de estado
- **Error de carga**: Fallback a estado de cámara
- **Navegador incompatible**: Funcionalidad básica disponible
- **Permisos insuficientes**: Controlado por ProtectedRoute

---

**Nota**: Esta funcionalidad está integrada completamente con el sistema de grabación existente y mantiene toda la funcionalidad de monitoreo en tiempo real.

