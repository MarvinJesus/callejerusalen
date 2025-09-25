# Calle Jerusalén - Plataforma Comunitaria

Una aplicación web comunitaria desarrollada con Next.js 14, Firebase y TailwindCSS para conectar residentes y visitantes de la comunidad Calle Jerusalén.

## 🚀 Características

### Para Visitantes
- **Lugares de Recreación**: Descubre parques, canchas, bibliotecas y más
- **Servicios Locales**: Encuentra restaurantes, tiendas, clínicas y bancos
- **Información de Contacto**: Acceso directo a la administración comunitaria
- **Mapa Interactivo**: Visualiza todos los puntos de interés

### Para Residentes
- **Cámaras de Seguridad**: Monitoreo en tiempo real de áreas comunes
- **Botón de Pánico**: Sistema de emergencia para situaciones críticas
- **Alertas Comunitarias**: Notificaciones sobre eventos y emergencias
- **Reportes de Seguridad**: Sistema para reportar incidentes

### Funcionalidades Generales
- **Autenticación Segura**: Sistema de login con Firebase Auth
- **Sistema de Roles Avanzado**: Invitado, Visitante, Residente y Super Administrador
- **Usuario Invitado**: Acceso sin registro para explorar la comunidad
- **Panel de Administración**: Gestión completa del sistema para super administradores
- **Diseño Responsivo**: Optimizado para móviles y desktop
- **Mapa Interactivo**: Integración con Leaflet para visualización geográfica

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Estilos**: TailwindCSS
- **Autenticación**: Firebase Auth
- **Base de Datos**: Firebase Firestore
- **Mapas**: Leaflet + React Leaflet
- **Notificaciones**: React Hot Toast
- **Iconos**: Lucide React
- **Deploy**: Vercel

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase
- Cuenta de Vercel (para deploy)

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd callejerusalen-community
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales de Firebase:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_google_maps_key
   ```

4. **Configurar Firebase**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Authentication (Email/Password)
   - Habilita Firestore Database
   - Configura las reglas de seguridad

5. **Crear Super Administrador** (Opcional)
   ```bash
   npm run init-admin
   ```
   Esto creará un super administrador con las credenciales:
   - Email: `admin@callejerusalen.com`
   - Contraseña: `Admin123!@#`

6. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Estructura del Proyecto

```
├── app/                    # App Router de Next.js
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página de inicio
│   ├── login/             # Páginas de autenticación
│   ├── register/
│   ├── visitantes/        # Módulo de visitantes
│   │   ├── lugares/
│   │   ├── servicios/
│   │   └── contacto/
│   ├── residentes/        # Módulo de residentes
│   │   ├── camaras/
│   │   ├── alertas/
│   │   └── panico/
│   └── mapa/              # Mapa interactivo
├── components/            # Componentes reutilizables
│   ├── Navbar.tsx
│   └── MapComponent.tsx
├── context/               # Contextos de React
│   └── AuthContext.tsx
├── lib/                   # Utilidades y configuración
│   ├── firebase.ts
│   └── auth.ts
└── public/                # Archivos estáticos
```

## 🔧 Configuración de Firebase

### Authentication
1. Ve a Authentication > Sign-in method
2. Habilita "Email/Password"
3. Configura las reglas de seguridad según tus necesidades

### Firestore
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

## 🚀 Deploy en Vercel

1. **Conectar con GitHub**
   - Sube tu código a un repositorio de GitHub
   - Conecta tu cuenta de Vercel con GitHub

2. **Configurar variables de entorno en Vercel**
   - Ve a tu proyecto en Vercel Dashboard
   - Settings > Environment Variables
   - Agrega todas las variables de Firebase

3. **Deploy automático**
   - Vercel detectará automáticamente que es un proyecto Next.js
   - Cada push a la rama `main` desplegará automáticamente

## 👥 Sistema de Roles

### Tipos de Usuario

1. **👤 Usuario Invitado**: Acceso sin registro
   - Explorar lugares y servicios
   - Ver mapa interactivo
   - Contactar a la comunidad

2. **👁️ Visitante**: Miembro registrado de la comunidad
   - Todas las funciones del invitado
   - Acceso a información detallada
   - Participar en eventos

3. **🛡️ Residente**: Residente verificado
   - Todas las funciones del visitante
   - Cámaras de seguridad
   - Botón de pánico
   - Alertas comunitarias

4. **👑 Super Administrador**: Administrador del sistema
   - Todas las funciones anteriores
   - Panel de administración
   - Gestión de usuarios
   - Configuración del sistema

### Cuentas de Demostración

Para probar la aplicación, puedes usar estas cuentas de demostración:

- **Visitante**: `visitante@demo.com` / `demo123`
- **Residente**: `residente@demo.com` / `demo123`
- **Super Admin**: `admin@callejerusalen.com` / `Admin123!@#`

## 🔒 Seguridad

- Autenticación basada en Firebase Auth
- Roles de usuario con permisos diferenciados
- Validación de datos en frontend y backend
- Headers de seguridad configurados en Vercel
- Variables de entorno para credenciales sensibles

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: admin@callejerusalen.com
- 📱 Teléfono: +1 (555) 123-4567

## 🎯 Roadmap

### Próximas características:
- [ ] Notificaciones push
- [ ] Chat comunitario
- [ ] Sistema de eventos
- [ ] Reportes de mantenimiento
- [ ] Integración con servicios de emergencia
- [ ] App móvil nativa
- [ ] Sistema de votaciones comunitarias

---

**Desarrollado con ❤️ para la comunidad de Calle Jerusalén**

