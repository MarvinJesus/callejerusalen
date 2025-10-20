# Sistema de Panel de Seguridad Personalizado

## 📋 Resumen

Se ha implementado un sistema completo de panel de seguridad personalizado para cada usuario residente, donde pueden solicitar acceso a cámaras específicas y ver las transmisiones a las que tienen permiso.

## 🎯 Funcionalidades Implementadas

### 1. Panel de Seguridad Personal (`/residentes/seguridad`)
- **Acceso**: Solo usuarios con Plan de Seguridad activo
- **Funcionalidades**:
  - Vista de todas las cámaras disponibles
  - Filtros por estado (en línea, desconectada, mantenimiento)
  - Búsqueda por nombre y ubicación
  - Vista en cuadrícula o lista
  - Estadísticas de acceso del usuario

### 2. Sistema de Solicitud de Acceso
- **Proceso**:
  1. Usuario selecciona una cámara sin acceso
  2. Completa formulario con razón de la solicitud
  3. Solicitud se envía a administradores
  4. Administradores aprueban/rechazan con comentarios
  5. Usuario recibe notificación del resultado

### 3. Visor de Cámaras Individual (`/residentes/seguridad/camara/[id]`)
- **Funcionalidades**:
  - Transmisión en tiempo real
  - Controles de reproducción (play/pause, volumen)
  - Captura de pantalla
  - Grabación de video (si tiene permisos de control)
  - Zoom y pan de la imagen
  - Pantalla completa
  - Información detallada de la cámara

### 4. Panel de Administración (`/admin/camera-requests`)
- **Acceso**: Solo administradores y super administradores
- **Funcionalidades**:
  - Ver todas las solicitudes de acceso
  - Filtrar por estado (pendiente, aprobada, rechazada)
  - Aprobar solicitudes con nivel de acceso específico
  - Rechazar solicitudes con razón
  - Estadísticas de solicitudes

## 🏗️ Arquitectura del Sistema

### APIs Implementadas

#### `/api/cameras`
- **GET**: Obtiene lista de cámaras disponibles para el usuario
- **Autenticación**: Requerida
- **Filtros**: Por nivel de acceso del usuario

#### `/api/cameras/[id]`
- **GET**: Obtiene información específica de una cámara
- **Autenticación**: Requerida
- **Validación**: Verifica acceso del usuario a la cámara

#### `/api/cameras/access/[userId]`
- **GET**: Obtiene lista de accesos del usuario
- **Autenticación**: Requerida
- **Autorización**: Solo propio usuario o administradores

#### `/api/cameras/access/[userId]/[cameraId]`
- **GET**: Obtiene acceso específico a una cámara
- **Autenticación**: Requerida
- **Autorización**: Solo propio usuario o administradores

#### `/api/cameras/request-access`
- **POST**: Crea nueva solicitud de acceso
- **Autenticación**: Requerida
- **Validación**: Usuario solo puede solicitar para sí mismo

#### `/api/cameras/requests/[userId]`
- **GET**: Obtiene solicitudes del usuario
- **Autenticación**: Requerida
- **Autorización**: Solo propio usuario o administradores

#### `/api/cameras/requests`
- **GET**: Obtiene todas las solicitudes (solo administradores)
- **Autenticación**: Requerida
- **Autorización**: Solo administradores

#### `/api/cameras/requests/[requestId]/approve`
- **POST**: Aprueba una solicitud de acceso
- **Autenticación**: Requerida
- **Autorización**: Solo administradores

#### `/api/cameras/requests/[requestId]/reject`
- **POST**: Rechaza una solicitud de acceso
- **Autenticación**: Requerida
- **Autorización**: Solo administradores

### Estructura de Datos

#### Cámaras
```typescript
interface Camera {
  id: string;
  name: string;
  location: string;
  description: string;
  streamUrl: string;
  status: 'online' | 'offline' | 'maintenance';
  accessLevel: 'public' | 'restricted' | 'private';
  coordinates?: { lat: number; lng: number };
  lastSeen?: Date;
  thumbnail?: string;
  resolution?: string;
  fps?: number;
  recordingEnabled?: boolean;
}
```

#### Acceso de Usuario
```typescript
interface UserCameraAccess {
  cameraId: string;
  accessLevel: 'view' | 'control';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}
```

#### Solicitud de Acceso
```typescript
interface CameraAccessRequest {
  id: string;
  userId: string;
  cameraId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  userEmail: string;
  userName: string;
}
```

## 🔐 Sistema de Permisos

### Nuevos Permisos Agregados
- `security.camera_requests`: Ver solicitudes de acceso a cámaras
- `security.camera_approve`: Aprobar solicitudes de acceso a cámaras
- `security.camera_reject`: Rechazar solicitudes de acceso a cámaras

### Niveles de Acceso a Cámaras
1. **Público**: Acceso automático para todos los usuarios con Plan de Seguridad
2. **Restringido**: Requiere solicitud y aprobación
3. **Privado**: Solo administradores y usuarios con acceso específico

### Niveles de Control
1. **Visualización**: Solo ver transmisión
2. **Control**: Ver transmisión + grabar + capturar pantalla

## 🎨 Interfaz de Usuario

### Panel de Seguridad Personal
- **Diseño**: Moderno con gradientes y efectos glassmorphism
- **Responsive**: Adaptable a dispositivos móviles
- **Estados**: Indicadores visuales de estado de cámaras
- **Filtros**: Búsqueda y filtrado avanzado

### Visor de Cámaras
- **Controles**: Intuitivos con overlay en hover
- **Funcionalidades**: Zoom, pan, grabación, captura
- **Información**: Detalles completos de la cámara
- **Sidebar**: Acciones rápidas y estado

### Panel de Administración
- **Tabla**: Vista completa de solicitudes
- **Modales**: Aprobación y rechazo con formularios
- **Estadísticas**: Métricas de solicitudes
- **Filtros**: Búsqueda y filtrado por estado

## 🔄 Flujo de Trabajo

### Para Usuarios Residentes
1. Acceder a `/residentes/seguridad`
2. Ver cámaras disponibles y su estado de acceso
3. Solicitar acceso a cámaras restringidas/privadas
4. Recibir notificación de aprobación/rechazo
5. Acceder a cámaras aprobadas en `/residentes/seguridad/camara/[id]`

### Para Administradores
1. Acceder a `/admin/camera-requests`
2. Ver solicitudes pendientes
3. Revisar razón de solicitud
4. Aprobar con nivel de acceso específico
5. Rechazar con razón explicativa

## 📱 Características Técnicas

### Seguridad
- Autenticación requerida en todas las APIs
- Autorización basada en roles y permisos
- Validación de acceso a cámaras específicas
- Logs de todas las acciones administrativas

### Performance
- Carga lazy de transmisiones
- Optimización de imágenes
- Caché de datos de cámaras
- Compresión de video

### Usabilidad
- Interfaz intuitiva y moderna
- Feedback visual inmediato
- Notificaciones en tiempo real
- Responsive design

## 🚀 Próximas Mejoras

1. **Notificaciones Push**: Alertas en tiempo real
2. **Historial de Acceso**: Logs de visualización
3. **Grabación Automática**: En eventos específicos
4. **Análisis de Movimiento**: Detección automática
5. **Integración con Alarmas**: Activación automática
6. **Múltiples Cámaras**: Vista simultánea
7. **Geolocalización**: Ubicación en mapa
8. **Exportación**: Descarga de grabaciones

## 📝 Notas de Implementación

- El sistema está completamente integrado con el sistema de permisos existente
- Utiliza Firebase para almacenamiento y autenticación
- Compatible con el sistema de notificaciones existente
- Respeta las reglas de Firestore configuradas
- Mantiene consistencia con el diseño del sistema

## 🔧 Configuración Requerida

1. **Firestore Collections**:
   - `cameraAccess`: Accesos de usuarios a cámaras
   - `cameraAccessRequests`: Solicitudes de acceso
   - `notifications`: Notificaciones del sistema

2. **Permisos de Usuario**:
   - Los administradores necesitan los nuevos permisos de cámaras
   - Los residentes necesitan Plan de Seguridad activo

3. **URLs de Cámaras**:
   - Configurar URLs de transmisión en el código
   - Ajustar configuración de Next.js para dominios permitidos

El sistema está listo para uso en producción y proporciona una experiencia completa de vigilancia personalizada para cada usuario residente.



