# Guía de Desarrollo - Calle Jerusalén Community

Esta guía te ayudará a configurar el entorno de desarrollo y entender la arquitectura del proyecto.

## 🛠️ Configuración del Entorno de Desarrollo

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Git
- Editor de código (VS Code recomendado)
- Cuenta de Firebase

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <repository-url>
   cd callejerusalen-community
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp env.example .env.local
   ```

4. **Configurar Firebase:**
   - Crear proyecto en Firebase Console
   - Habilitar Authentication y Firestore
   - Copiar credenciales a `.env.local`

5. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## 📁 Estructura del Proyecto

```
├── app/                    # App Router de Next.js 14
│   ├── globals.css        # Estilos globales con TailwindCSS
│   ├── layout.tsx         # Layout principal con AuthProvider
│   ├── page.tsx           # Página de inicio
│   ├── login/             # Páginas de autenticación
│   │   └── page.tsx       # Página de login
│   ├── register/
│   │   └── page.tsx       # Página de registro
│   ├── visitantes/        # Módulo de visitantes
│   │   ├── lugares/
│   │   │   └── page.tsx   # Lista de lugares de recreación
│   │   ├── servicios/
│   │   │   └── page.tsx   # Lista de servicios locales
│   │   └── contacto/
│   │       └── page.tsx   # Página de contacto
│   ├── residentes/        # Módulo de residentes
│   │   ├── camaras/
│   │   │   └── page.tsx   # Cámaras de seguridad
│   │   ├── alertas/
│   │   │   └── page.tsx   # Alertas comunitarias
│   │   └── panico/
│   │       └── page.tsx   # Botón de pánico
│   └── mapa/
│       └── page.tsx       # Mapa interactivo
├── components/            # Componentes reutilizables
│   ├── Navbar.tsx        # Barra de navegación principal
│   └── MapComponent.tsx  # Componente de mapa con Leaflet
├── context/               # Contextos de React
│   └── AuthContext.tsx   # Contexto de autenticación
├── lib/                   # Utilidades y configuración
│   ├── firebase.ts       # Configuración de Firebase
│   ├── auth.ts           # Funciones de autenticación
│   └── leaflet.ts        # Configuración de Leaflet
├── public/                # Archivos estáticos
└── styles/                # Archivos de estilos adicionales
```

## 🔧 Configuración de Firebase

### 1. Crear Proyecto

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Google Analytics (opcional)

### 2. Configurar Authentication

1. Ve a Authentication > Sign-in method
2. Habilita "Email/Password"
3. Configura dominios autorizados:
   - `localhost:3000` (desarrollo)
   - Tu dominio de producción

### 3. Configurar Firestore

1. Ve a Firestore Database
2. Crea la base de datos en modo de prueba
3. Configura las reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir su propio perfil
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reportes de pánico - solo residentes pueden crear
    match /panicReports/{reportId} {
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'residente';
      allow read: if request.auth != null;
    }
    
    // Alertas comunitarias - solo residentes pueden crear
    match /alerts/{alertId} {
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'residente';
      allow read: if request.auth != null;
    }
  }
}
```

### 4. Obtener Credenciales

1. Ve a Project Settings > General
2. En "Your apps", agrega una app web
3. Copia las credenciales a `.env.local`

## 🎨 Estilos y Diseño

### TailwindCSS

El proyecto usa TailwindCSS para estilos. Los colores principales están definidos en `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... más tonos
    900: '#1e3a8a',
  },
  secondary: {
    // ... tonos de gris
  }
}
```

### Componentes Reutilizables

Clases CSS personalizadas en `globals.css`:

```css
.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
}

.card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}
```

## 🔐 Autenticación y Roles

### Sistema de Roles

- **Visitante**: Acceso a lugares, servicios y contacto
- **Residente**: Acceso completo incluyendo cámaras, alertas y botón de pánico

### Contexto de Autenticación

El `AuthContext` maneja:
- Estado de autenticación
- Perfil del usuario
- Cambio de roles
- Persistencia de sesión

### Protección de Rutas

Las páginas están protegidas por:
1. Verificación de autenticación
2. Verificación de rol específico
3. Redirección automática

## 🗺️ Integración de Mapas

### Leaflet

El proyecto usa Leaflet para mapas interactivos:

1. **Configuración**: `lib/leaflet.ts`
2. **Componente**: `components/MapComponent.tsx`
3. **Página**: `app/mapa/page.tsx`

### Tipos de Puntos

- **Lugares**: Parques, canchas, bibliotecas
- **Servicios**: Restaurantes, tiendas, clínicas
- **Cámaras**: Puntos de monitoreo de seguridad
- **Alertas**: Reportes de emergencia

## 📱 Responsive Design

### Breakpoints

- **Mobile**: 320px+
- **Tablet**: 768px+
- **Desktop**: 1024px+

### Componentes Responsivos

- Navbar con menú hamburguesa en móvil
- Grids adaptativos
- Imágenes responsivas
- Formularios optimizados para móvil

## 🧪 Testing

### Estructura de Tests

```bash
# Ejecutar tests
npm run test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Tipos de Tests

1. **Unit Tests**: Componentes individuales
2. **Integration Tests**: Flujos completos
3. **E2E Tests**: Casos de uso end-to-end

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter de código

# Testing
npm run test         # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con coverage

# Deploy
npm run deploy       # Deploy a Vercel
```

## 🔍 Debugging

### Herramientas de Desarrollo

1. **React Developer Tools**
2. **Firebase Emulator Suite**
3. **Vercel CLI**
4. **Browser DevTools**

### Logs y Monitoreo

```javascript
// Logs de desarrollo
console.log('Debug info:', data);

// Logs de Firebase
import { getAnalytics, logEvent } from 'firebase/analytics';
logEvent(analytics, 'user_action', { action: 'button_click' });
```

## 📦 Dependencias Principales

### Frontend
- **Next.js 14**: Framework de React
- **React 18**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **TailwindCSS**: Framework de CSS

### Backend
- **Firebase Auth**: Autenticación
- **Firebase Firestore**: Base de datos
- **Firebase Analytics**: Analytics

### UI/UX
- **Lucide React**: Iconos
- **React Hot Toast**: Notificaciones
- **Leaflet**: Mapas interactivos

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de Firebase**: Verificar credenciales en `.env.local`
2. **Error de Mapas**: Verificar que Leaflet se carga correctamente
3. **Error de Build**: Verificar dependencias y TypeScript
4. **Error de Autenticación**: Verificar configuración de Firebase

### Debugging

```bash
# Ver logs detallados
DEBUG=* npm run dev

# Verificar variables de entorno
npm run env:check

# Limpiar cache
npm run clean
```

## 📚 Recursos Adicionales

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Vercel Documentation](https://vercel.com/docs)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

### Estándares de Código

- Usar TypeScript
- Seguir convenciones de React
- Escribir tests para nuevas funcionalidades
- Documentar componentes complejos
- Usar ESLint y Prettier

---

¡Feliz desarrollo! 🚀











