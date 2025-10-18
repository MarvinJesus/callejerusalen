# Sistema de Temas - Calle Jerusalén Community

## Descripción General

El sistema de temas permite cambiar dinámicamente el aspecto visual de toda la aplicación con un solo clic. Utiliza variables CSS personalizadas y un contexto de React para gestionar el estado del tema.

## Características

- ✅ **5 Temas Predefinidos**: Moderno Azul, Verde Naturaleza, Púrpura Elegante, Naranja Energético, Oscuro Profesional
- ✅ **Cambio Dinámico**: Los temas se aplican instantáneamente sin recargar la página
- ✅ **Persistencia**: El tema seleccionado se guarda en localStorage
- ✅ **Variables CSS**: Sistema basado en variables CSS para fácil personalización
- ✅ **Componentes Temáticos**: Clases CSS predefinidas para componentes comunes
- ✅ **Responsive**: Todos los temas se adaptan a diferentes tamaños de pantalla

## Temas Disponibles

### 1. 🎨 Moderno Azul (Default)
- **Colores**: Azules profesionales
- **Uso**: Ideal para aplicaciones corporativas y profesionales
- **Gradiente**: Azul a azul oscuro

### 2. 🌿 Verde Naturaleza
- **Colores**: Verdes y amarillos naturales
- **Uso**: Perfecto para aplicaciones relacionadas con naturaleza y ecología
- **Gradiente**: Verde a amarillo

### 3. 💜 Púrpura Elegante
- **Colores**: Púrpuras y rosas elegantes
- **Uso**: Ideal para aplicaciones de lujo y elegancia
- **Gradiente**: Púrpura a rosa

### 4. 🔥 Naranja Energético
- **Colores**: Naranjas y amarillos vibrantes
- **Uso**: Perfecto para aplicaciones dinámicas y energéticas
- **Gradiente**: Naranja a amarillo

### 5. 🌙 Oscuro Profesional
- **Colores**: Grises oscuros y blancos
- **Uso**: Ideal para uso nocturno y aplicaciones profesionales
- **Gradiente**: Gris oscuro a negro

## Implementación Técnica

### Estructura de Archivos

```
├── app/
│   ├── themes.css              # Variables CSS y estilos de temas
│   └── layout.tsx              # Layout principal con ThemeProvider
├── context/
│   └── ThemeContext.tsx        # Contexto de React para gestión de temas
└── components/
    └── ThemeSwitcher.tsx       # Componente selector de temas
```

### Variables CSS

Cada tema define sus propias variables CSS:

```css
:root {
  /* Colores principales */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  /* ... más variables */
  
  /* Gradientes */
  --gradient-primary: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
  
  /* Sombras */
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  
  /* Transiciones */
  --transition-normal: 250ms ease-in-out;
}
```

### Aplicación de Temas

Los temas se aplican mediante el atributo `data-theme` en el elemento `<body>`:

```html
<body data-theme="nature">
  <!-- Contenido de la aplicación -->
</body>
```

### Clases CSS Temáticas

#### Botones
```css
.btn-theme-primary    /* Botón principal con gradiente */
.btn-theme-secondary  /* Botón secundario con gradiente */
.btn-theme-outline    /* Botón con borde */
```

#### Componentes
```css
.card-theme          /* Tarjeta con sombra y bordes redondeados */
.input-theme         /* Campo de entrada estilizado */
.navbar-theme        /* Barra de navegación */
.footer-theme        /* Pie de página */
.bg-theme           /* Fondo de página con gradiente */
```

#### Utilidades
```css
.text-primary        /* Texto con color primario */
.bg-primary          /* Fondo con color primario */
.border-primary      /* Borde con color primario */
.bg-gradient-primary /* Fondo con gradiente primario */
.shadow-theme-md     /* Sombra mediana */
.rounded-theme-lg    /* Bordes redondeados grandes */
.transition-theme-normal /* Transición normal */
```

## Uso del Sistema

### 1. Cambiar Tema Programáticamente

```typescript
import { useTheme } from '@/context/ThemeContext';

const MyComponent = () => {
  const { theme, setTheme } = useTheme();
  
  const handleThemeChange = () => {
    setTheme('nature'); // Cambiar a tema verde naturaleza
  };
  
  return (
    <button onClick={handleThemeChange}>
      Cambiar a tema naturaleza
    </button>
  );
};
```

### 2. Usar Clases Temáticas

```jsx
// Botón con tema
<button className="btn-theme-primary">
  Botón Principal
</button>

// Card con tema
<div className="card-theme">
  <h3>Contenido de la tarjeta</h3>
</div>

// Input con tema
<input className="input-theme" placeholder="Escribe aquí..." />
```

### 3. Acceder a Variables CSS

```css
.my-custom-component {
  background: var(--gradient-primary);
  color: var(--primary-600);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}
```

## Componente ThemeSwitcher

El selector de temas se encuentra en el navbar y permite:

- **Vista previa**: Cada tema muestra un pequeño preview de colores
- **Descripción**: Información sobre cada tema
- **Selección visual**: Indica cuál tema está activo
- **Persistencia**: Guarda automáticamente la selección

### Ubicación
- **Desktop**: En el navbar, junto al nombre del usuario
- **Mobile**: En el menú móvil

## Personalización

### Agregar Nuevo Tema

1. **Definir variables CSS** en `app/themes.css`:

```css
body[data-theme="mi-tema"] {
  --primary-50: #f0f9ff;
  --primary-100: #e0f2fe;
  /* ... definir todas las variables */
  
  --gradient-primary: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
  --gradient-bg: linear-gradient(135deg, var(--primary-50), var(--secondary-50));
}
```

2. **Agregar al contexto** en `context/ThemeContext.tsx`:

```typescript
const availableThemes = [
  // ... temas existentes
  {
    id: 'mi-tema' as Theme,
    name: 'Mi Tema Personalizado',
    description: 'Descripción de mi tema',
    preview: 'bg-gradient-to-r from-blue-500 to-purple-500'
  }
];
```

3. **Actualizar tipos** en `context/ThemeContext.tsx`:

```typescript
type Theme = 'default' | 'nature' | 'elegant' | 'energetic' | 'dark' | 'mi-tema';
```

### Modificar Colores Existentes

Para modificar un tema existente, edita las variables CSS correspondientes en `app/themes.css`:

```css
body[data-theme="nature"] {
  --primary-600: #tu-nuevo-color; /* Cambiar color primario */
  /* ... otros cambios */
}
```

## Animaciones y Transiciones

### Transición de Cambio de Tema

Cuando se cambia de tema, se aplica una transición suave:

```css
body {
  transition: all 0.3s ease-in-out;
}
```

### Animaciones Disponibles

```css
.animate-fade-in-up     /* Aparece desde abajo */
.animate-slide-in-right /* Desliza desde la derecha */
.animate-pulse-theme    /* Pulso continuo */
```

## Estados Especiales

### Carga
```css
.loading-theme::after {
  /* Efecto de carga con gradiente animado */
}
```

### Estados de Componentes
```css
.success-theme  /* Fondo verde para éxito */
.error-theme    /* Fondo rojo para errores */
.warning-theme  /* Fondo amarillo para advertencias */
```

## Responsive Design

Todos los temas se adaptan automáticamente a diferentes tamaños de pantalla:

```css
@media (max-width: 768px) {
  .btn-theme-primary {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }
  
  .card-theme {
    padding: 1rem;
    border-radius: var(--border-radius-lg);
  }
}
```

## Mejores Prácticas

### 1. Usar Variables CSS
```css
/* ✅ Correcto */
.my-component {
  color: var(--primary-600);
  background: var(--gradient-primary);
}

/* ❌ Incorrecto */
.my-component {
  color: #3b82f6;
  background: linear-gradient(135deg, #2563eb, #0284c7);
}
```

### 2. Usar Clases Temáticas
```jsx
// ✅ Correcto
<button className="btn-theme-primary">Botón</button>

// ❌ Incorrecto
<button className="bg-blue-600 text-white px-4 py-2 rounded">Botón</button>
```

### 3. Mantener Consistencia
- Usar siempre las mismas variables para colores similares
- Aplicar transiciones consistentes
- Mantener la jerarquía de colores (50, 100, 200, etc.)

## Troubleshooting

### Problemas Comunes

1. **Tema no se aplica**
   - Verificar que `ThemeProvider` esté envolviendo la aplicación
   - Comprobar que el atributo `data-theme` esté en el `<body>`

2. **Variables CSS no funcionan**
   - Verificar que `themes.css` esté importado en `layout.tsx`
   - Comprobar la sintaxis de las variables CSS

3. **Transiciones no suaves**
   - Verificar que las transiciones estén definidas en las variables CSS
   - Comprobar que no haya conflictos con otros estilos

### Debug

Para debuggear temas, puedes usar las herramientas de desarrollador:

```javascript
// Ver tema actual
console.log(document.body.getAttribute('data-theme'));

// Ver variables CSS
console.log(getComputedStyle(document.documentElement).getPropertyValue('--primary-600'));

// Cambiar tema manualmente
document.body.setAttribute('data-theme', 'nature');
```

## Rendimiento

- **CSS Variables**: Se calculan en tiempo de ejecución, pero son muy eficientes
- **Transiciones**: Se optimizan automáticamente por el navegador
- **Persistencia**: Solo se guarda en localStorage, no afecta el rendimiento

## Compatibilidad

- **Navegadores**: Compatible con todos los navegadores modernos
- **Dispositivos**: Funciona en desktop, tablet y móvil
- **Accesibilidad**: Mantiene el contraste adecuado en todos los temas

---

**Sistema de Temas desarrollado para Calle Jerusalén Community** 🎨✨















