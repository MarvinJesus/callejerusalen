# Google Earth Stream Integration

## Descripción

Se ha integrado una vista 3D de Google Earth en la sección de lugares de Calle Jerusalén. Esta integración permite a los usuarios explorar la zona en una vista tridimensional interactiva directamente desde la aplicación web.

## Características Implementadas

### 1. Componente GoogleEarthStream

- **Ubicación**: `components/GoogleEarthStream.tsx`
- **Funcionalidades**:
  - Vista 3D embebida de Google Earth
  - Modo pantalla completa
  - Botón de recarga
  - Estados de carga y error
  - Interfaz responsive
  - Controles de navegación

### 2. Integración en Páginas de Lugares

#### Página Principal de Lugares (`app/visitantes/lugares/page.tsx`)
- Toggle entre mapa interactivo y vista 3D
- Vista 3D de toda la zona de Calle Jerusalén
- Altura configurable (500px por defecto)

#### Página de Detalle de Lugar (`app/visitantes/lugares/[id]/page.tsx`)
- Toggle entre mapa estático y vista 3D
- Vista 3D específica para cada lugar
- Botones de acción adicionales para abrir en Google Maps/Earth

## URL de Google Earth

La URL utilizada apunta específicamente a Calle Jerusalén, Heredia, San Rafael con las siguientes coordenadas:
- **Latitud**: 10.02193128
- **Longitud**: -84.07814492
- **Altura**: 1432.60522461m
- **Orientación**: 340.69294323° horizontal, 84.43871213° vertical

## Uso

### Para Usuarios
1. Navegar a la sección "Lugares" desde el menú principal
2. Hacer clic en "Vista 3D" para activar la vista de Google Earth
3. Usar el mouse para:
   - Rotar la vista (arrastrar)
   - Hacer zoom (rueda del mouse)
   - Navegar por la zona
4. Usar los controles en la esquina superior derecha:
   - Recargar la vista
   - Activar pantalla completa

### Para Desarrolladores

#### Importar el Componente
```tsx
import GoogleEarthStream from '@/components/GoogleEarthStream';
```

#### Usar el Componente
```tsx
<GoogleEarthStream
  url="https://earth.google.com/web/..."
  title="Título de la Vista"
  height="400px"
  className="clases-css-adicionales"
/>
```

#### Props Disponibles
- `url` (string, requerido): URL de Google Earth
- `title` (string, opcional): Título mostrado en la interfaz
- `height` (string, opcional): Altura del contenedor (default: "400px")
- `className` (string, opcional): Clases CSS adicionales

## Consideraciones Técnicas

### Rendimiento
- El iframe se carga de forma lazy para mejorar el rendimiento
- Estados de carga y error para mejor UX
- Recarga manual disponible en caso de problemas

### Responsive Design
- El componente se adapta a diferentes tamaños de pantalla
- Modo pantalla completa disponible
- Controles optimizados para dispositivos móviles

### Accesibilidad
- Títulos descriptivos para lectores de pantalla
- Controles con tooltips informativos
- Estados de error claramente comunicados

## Personalización

### Cambiar la URL de Google Earth
Para cambiar la ubicación mostrada, modifica la constante `googleEarthUrl` en:
- `app/visitantes/lugares/page.tsx` (línea 189)
- `app/visitantes/lugares/[id]/page.tsx` (línea 140)

### Ajustar la Altura
Modifica el prop `height` en los componentes:
```tsx
<GoogleEarthStream
  height="600px" // Altura personalizada
  // ... otros props
/>
```

### Personalizar Estilos
El componente utiliza clases de Tailwind CSS que pueden ser sobrescritas:
```tsx
<GoogleEarthStream
  className="mi-clase-personalizada rounded-xl shadow-2xl"
  // ... otros props
/>
```

## Solución de Problemas

### Error 403 - Acceso Denegado
**Problema**: Google Earth no permite el embebido directo en iframes por razones de seguridad.

**Solución Implementada**:
1. **Detección Automática**: El componente detecta automáticamente el error 403
2. **Vista Alternativa**: Se muestra una vista satelital de Google Maps como alternativa
3. **Opciones de Navegación**: Botones para abrir en Google Earth o Google Maps en nueva pestaña
4. **Fallback Inteligente**: Si hay coordenadas disponibles, se muestra Google Maps embebido

**Flujo de Usuario**:
1. Usuario hace clic en "Vista 3D"
2. Si Google Earth no se puede embeber (error 403):
   - Se muestra mensaje explicativo
   - Opciones para abrir en Google Earth/Maps
   - Botón para "Ver vista satelital alternativa"
3. Al hacer clic en "vista satelital alternativa":
   - Se carga Google Maps embebido con vista satelital
   - Funciona perfectamente sin restricciones

### La Vista No Carga
1. Verificar conexión a internet
2. Usar el botón de recarga
3. Verificar que la URL de Google Earth sea válida
4. Comprobar que el navegador soporte iframes
5. **Nuevo**: Usar la vista satelital alternativa si Google Earth falla

### Problemas de Rendimiento
1. La vista 3D puede ser intensiva en recursos
2. Considerar desactivar en dispositivos con poca memoria
3. Usar lazy loading para mejorar la carga inicial
4. **Nuevo**: Google Maps embebido es más eficiente que Google Earth

### Problemas de Responsive
1. Verificar que el contenedor padre tenga dimensiones definidas
2. Ajustar la altura según el dispositivo
3. Probar en diferentes tamaños de pantalla
4. **Nuevo**: Google Maps embebido es completamente responsive

## Futuras Mejoras

- [ ] Integración con coordenadas específicas de cada lugar
- [ ] Marcadores personalizados en la vista 3D
- [ ] Modo offline con capturas estáticas
- [ ] Integración con datos de lugares en tiempo real
- [ ] Controles de navegación personalizados
