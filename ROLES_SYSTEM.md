# Sistema de Roles - Calle Jerusalén Community

## Descripción General

El sistema de roles de la aplicación Calle Jerusalén Community está diseñado para proporcionar diferentes niveles de acceso y funcionalidades según el tipo de usuario.

## Tipos de Usuario

### 1. 👁️ Visitante (`visitante`)
- **Acceso**: NO requiere registro - acceso automático al explorar
- **Funcionalidades**:
  - Explorar lugares de recreación
  - Ver servicios locales
  - Acceder al mapa interactivo
  - Contactar a la comunidad
  - Acceso a información detallada de lugares
  - Participar en eventos comunitarios
- **Restricciones**: No puede acceder a cámaras de seguridad ni botón de pánico
- **Nota**: Los visitantes NO se registran, solo exploran la comunidad

### 2. 🛡️ Comunidad (`comunidad`)
- **Acceso**: Requiere registro y verificación como miembro de la comunidad
- **Funcionalidades**:
  - Todas las funciones del visitante
  - Acceso a cámaras de seguridad (simuladas)
  - Botón de pánico para emergencias
  - Alertas comunitarias
  - Reportes de seguridad
- **Restricciones**: No puede acceder al panel de administración

### 3. 🔧 Administrador (`admin`)
- **Acceso**: Solo creado por super administrador
- **Funcionalidades**:
  - Todas las funciones de comunidad
  - Panel de administración limitado (solo lectura)
  - Ver usuarios y estadísticas
  - Ver solicitudes de registro (no puede aprobar/rechazar)
  - Ver logs del sistema (solo lectura)
  - Monitoreo de seguridad (solo lectura)
- **Restricciones**: No puede gestionar usuarios, aprobar solicitudes ni configurar el sistema

### 4. 👑 Super Administrador (`super_admin`)
- **Acceso**: Cuenta especial con permisos completos
- **Funcionalidades**:
  - Todas las funciones de administrador y comunidad
  - Panel de administración completo
  - Gestión completa de usuarios
  - Configuración del sistema
  - Monitoreo de seguridad completo
  - Estadísticas y reportes
  - Aprobar/rechazar solicitudes de acceso
  - Crear otros administradores y super administradores

## Implementación Técnica

### Estructura de Datos

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'invitado' | 'visitante' | 'residente' | 'admin' | 'super_admin';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  permissions?: string[]; // Solo para super_admin y admin
}
```

### Protección de Rutas

```typescript
// Ejemplo de uso del componente ProtectedRoute
<ProtectedRoute requiredRole="super_admin">
  <AdminDashboard />
</ProtectedRoute>

// O con múltiples roles permitidos
<ProtectedRoute allowedRoles={['residente', 'super_admin']}>
  <SecurityPanel />
</ProtectedRoute>
```

### Middleware de Autenticación

El middleware verifica automáticamente:
- Rutas protegidas que requieren autenticación
- Rutas de administración que requieren rol de super_admin
- Redirecciones apropiadas según el estado de autenticación

## Flujo de Usuario

### 1. Usuario Invitado
```
Página Principal → "Explorar como Invitado" → Acceso limitado
```

### 2. Registro de Residente
```
Página Principal → "Únete a la Comunidad" → Registro de Residente → Verificación por Super Admin
```

### 3. Super Administrador
```
Script de inicialización → admin@callejerusalen.com → Panel de administración
```

## Configuración Inicial

### Crear Super Administrador

```bash
# Ejecutar el script de inicialización
npm run init-admin
```

**Credenciales por defecto:**
- Email: `mar90jesus@gmail.com`
- Contraseña: `Admin123!@#`
- Rol: `super_admin`

⚠️ **IMPORTANTE**: Cambiar la contraseña después del primer inicio de sesión.

## Seguridad

### Medidas Implementadas

1. **Verificación de Roles**: Cada ruta protegida verifica el rol del usuario
2. **Middleware de Autenticación**: Verificación automática en el servidor
3. **Componentes de Protección**: Verificación en el cliente
4. **Firestore Security Rules**: Reglas de base de datos para proteger datos sensibles

### Reglas de Firestore

```javascript
// Ejemplo de reglas de seguridad
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo super admins pueden acceder a la colección de administración
    match /admin/{document} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
    
    // Usuarios solo pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Funcionalidades por Rol

| Funcionalidad | Invitado | Visitante | Residente | Admin | Super Admin |
|---------------|----------|-----------|-----------|--------|-------------|
| Ver lugares | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver servicios | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mapa interactivo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cámaras de seguridad | ❌ | ❌ | ✅ | ✅ | ✅ |
| Botón de pánico | ❌ | ❌ | ✅ | ✅ | ✅ |
| Alertas comunitarias | ❌ | ❌ | ✅ | ✅ | ✅ |
| Panel de administración (lectura) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Panel de administración (escritura) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gestión de usuarios | ❌ | ❌ | ❌ | ❌ | ✅ |
| Configuración del sistema | ❌ | ❌ | ❌ | ❌ | ✅ |

## Mantenimiento

### Agregar Nuevos Roles

1. Actualizar el tipo `UserRole` en `lib/auth.ts`
2. Agregar el rol a las funciones de verificación
3. Actualizar el componente `ProtectedRoute`
4. Modificar las reglas de Firestore si es necesario
5. Actualizar la documentación

### Cambiar Permisos

1. Modificar las funciones de verificación en `ProtectedRoute`
2. Actualizar las reglas de Firestore
3. Probar todos los flujos de usuario afectados

## Troubleshooting

### Problemas Comunes

1. **Usuario no puede acceder a una sección**
   - Verificar que el rol esté correctamente asignado en Firestore
   - Comprobar que la ruta esté protegida correctamente

2. **Super administrador no puede acceder al panel**
   - Verificar que el rol sea exactamente `super_admin`
   - Comprobar que el usuario esté activo (`isActive: true`)

3. **Error de permisos en Firestore**
   - Verificar las reglas de seguridad
   - Comprobar que el usuario esté autenticado

### Logs y Debugging

```javascript
// Habilitar logs de Firebase
console.log('User Profile:', userProfile);
console.log('Required Role:', requiredRole);
console.log('Access Granted:', userProfile?.role === requiredRole);
```

