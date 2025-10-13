# Sistema de Botón de Pánico - Configuración Avanzada

## 📋 Descripción General

El sistema de botón de pánico ha sido mejorado para permitir a los usuarios configurar sus contactos de emergencia personalizados del plan de seguridad comunitaria. Esto permite respuestas más rápidas y efectivas ante situaciones de emergencia.

## 🎯 Características Principales

### 1. **Configuración de Contactos de Emergencia**
- Selección de contactos específicos del plan de seguridad
- Opción de notificar a todos los miembros activos
- Priorización de contactos cercanos o con respuesta rápida
- Visualización de información detallada:
  - Nombre completo
  - Email
  - Teléfono
  - Sector de la comunidad
  - Habilidades (primeros auxilios, seguridad, etc.)

### 2. **Personalización de Alertas**
- Ubicación por defecto configurable
- Mensaje personalizado opcional
- Información de contactos seleccionados
- Visualización del número de personas que serán notificadas

### 3. **Activación del Botón de Pánico**
- Countdown de 5 segundos para cancelar
- Notificación automática a contactos configurados
- Registro en historial de alertas
- Información de ubicación y descripción específica

### 4. **Historial de Alertas**
- Visualización de todas las alertas enviadas
- Estado de cada alerta (Activo/Resuelto)
- Número de personas notificadas
- Fecha y hora de activación
- Ubicación y descripción detallada

## 🔐 Requisitos de Acceso

Para acceder al sistema de botón de pánico, los usuarios deben:

1. ✅ Estar registrados como residentes de la comunidad
2. ✅ Estar inscritos en el Plan de Seguridad Comunitaria
3. ✅ Tener estado "active" en el plan de seguridad
4. ✅ Ser aprobados por un administrador

**Nota:** Los administradores y super administradores tienen acceso automático.

## 📱 Estructura de la Interfaz

### Pestaña 1: Configuración
```
├── Selección de Contactos de Emergencia
│   ├── Opción: Notificar a todos
│   └── Lista de usuarios del plan de seguridad
│       ├── Nombre y email
│       ├── Teléfono
│       ├── Sector
│       └── Habilidades
├── Ubicación por defecto (opcional)
├── Mensaje personalizado (opcional)
└── Botón: Guardar Configuración
```

### Pestaña 2: Botón de Pánico
```
├── Botón de activación
├── Información de contactos configurados
├── Formulario opcional
│   ├── Ubicación específica
│   └── Descripción de emergencia
└── Countdown de cancelación (cuando está activo)
```

### Pestaña 3: Historial
```
├── Lista de alertas enviadas
│   ├── Fecha y hora
│   ├── Ubicación
│   ├── Descripción
│   ├── Número de personas notificadas
│   └── Estado (Activo/Resuelto)
└── Indicador de "Sin alertas"
```

## 🗄️ Estructura de Datos

### Colección: `panicButtonSettings`
```typescript
{
  userId: string;                  // ID del usuario
  emergencyContacts: string[];     // Array de userIds del plan de seguridad
  notifyAll: boolean;              // Si es true, notifica a todos
  customMessage?: string;          // Mensaje personalizado
  location?: string;               // Ubicación por defecto
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Colección: `panicReports`
```typescript
{
  userId: string;                  // ID del usuario que activó la alerta
  userName: string;                // Nombre del usuario
  userEmail: string;               // Email del usuario
  location: string;                // Ubicación de la emergencia
  description: string;             // Descripción de la emergencia
  timestamp: Timestamp;            // Fecha y hora de activación
  status: 'active' | 'resolved';   // Estado de la alerta
  emergencyContacts: string[];     // Números de emergencia nacional (911, etc.)
  notifiedUsers: string[];         // UserIds de los usuarios notificados
}
```

### Colección: `securityRegistrations`
```typescript
{
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  phoneNumber: string;
  address: string;
  availability: string;            // 'full_time', 'part_time', 'weekends'
  skills: string[];                // ['Primeros Auxilios', 'Seguridad', etc.]
  otherSkills?: string;
  status: 'pending' | 'active' | 'rejected';
  sector?: string;                 // Sector de la comunidad
  submittedAt: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🔧 Funciones Principales

### `getActiveSecurityPlanUsers()`
Obtiene todos los usuarios activos del plan de seguridad.
```typescript
const users = await getActiveSecurityPlanUsers();
// Retorna: SecurityPlanRegistration[]
```

### `savePanicButtonSettings(userId, settings)`
Guarda la configuración del botón de pánico para un usuario.
```typescript
await savePanicButtonSettings(user.uid, {
  emergencyContacts: ['userId1', 'userId2'],
  notifyAll: false,
  customMessage: 'Necesito ayuda urgente',
  location: 'Calle Principal #123'
});
```

### `getPanicButtonSettings(userId)`
Obtiene la configuración del botón de pánico de un usuario.
```typescript
const settings = await getPanicButtonSettings(user.uid);
// Retorna: PanicButtonSettings | null
```

## 🎨 Flujo de Usuario

### 1. Primera Vez
```
Usuario ingresa → Pestaña Configuración abierta por defecto
→ Selecciona contactos de emergencia
→ Configura ubicación y mensaje (opcional)
→ Guarda configuración
→ Va a pestaña "Botón de Pánico"
```

### 2. Activación de Alerta
```
Usuario en emergencia → Pestaña "Botón de Pánico"
→ Verifica contactos configurados
→ Ingresa ubicación/descripción específica (opcional)
→ Presiona botón de pánico
→ Countdown de 5 segundos
→ [Opción: Cancelar antes de que termine]
→ Alerta enviada
→ Redirige a "Historial" automáticamente
```

### 3. Revisión de Historial
```
Usuario → Pestaña "Historial"
→ Ve todas sus alertas anteriores
→ Verifica estado de cada alerta
→ Revisa cuántas personas fueron notificadas
```

## 🔒 Reglas de Firestore

### Permisos de `panicButtonSettings`
```javascript
// Los usuarios solo pueden gestionar su propia configuración
allow create, read, update: if request.auth.uid == userId;
allow delete: if request.auth.uid == userId || isAdminOrSuperAdmin();

// Los administradores pueden leer todas las configuraciones
allow read: if isAdminOrSuperAdmin();
```

### Permisos de `panicReports`
```javascript
// Requiere acceso al plan de seguridad para crear reportes
allow create: if hasSecurityAccess();

// Los usuarios con acceso al plan pueden leer reportes
allow read: if hasSecurityAccess() || isAdminOrSuperAdmin();

// Solo administradores pueden modificar reportes
allow write: if isAdminOrSuperAdmin();
```

### Permisos de `securityRegistrations`
```javascript
// Los usuarios pueden crear su propia inscripción
allow create: if request.auth.uid == registrationId;

// Los usuarios con acceso al plan pueden ver todas las inscripciones activas
// (necesario para seleccionar contactos de emergencia)
allow read: if request.auth.uid == registrationId 
         || isAdminOrSuperAdmin() 
         || hasSecurityAccess();

// Solo administradores pueden modificar inscripciones
allow update, delete: if isAdminOrSuperAdmin();
```

## 🚀 Mejoras Implementadas

### Antes
- ❌ Botón de pánico genérico
- ❌ Sin selección de contactos
- ❌ Sin configuración personalizada
- ❌ Notificación solo a números de emergencia nacional

### Después
- ✅ Sistema de configuración completo
- ✅ Selección de contactos específicos del plan de seguridad
- ✅ Priorización por cercanía y habilidades
- ✅ Configuración personalizada de ubicación y mensaje
- ✅ Opción de notificar a todos o solo a contactos seleccionados
- ✅ Historial completo de alertas
- ✅ Información detallada de cada alerta
- ✅ Countdown de cancelación
- ✅ Interfaz con pestañas intuitiva

## 📊 Ventajas del Sistema

### Para los Usuarios
1. **Mayor control**: Eligen quién responderá a sus emergencias
2. **Respuesta más rápida**: Seleccionan contactos cercanos
3. **Personalización**: Configuran ubicación y mensajes predeterminados
4. **Transparencia**: Ven historial completo de alertas

### Para la Comunidad
1. **Mejor coordinación**: Los contactos seleccionados están mejor preparados
2. **Respuesta efectiva**: Se notifica a personas con habilidades relevantes
3. **Reducción de falsas alarmas**: Countdown de 5 segundos para cancelar
4. **Trazabilidad**: Historial completo para análisis y mejoras

### Para Administradores
1. **Visibilidad completa**: Acceso a todas las configuraciones
2. **Gestión centralizada**: Control de todos los reportes de pánico
3. **Análisis de patrones**: Datos históricos para mejorar el sistema
4. **Escalabilidad**: Sistema preparado para crecimiento de la comunidad

## 📱 Casos de Uso

### Caso 1: Residente con Emergencia Médica
```
1. Tiene configurados contactos con habilidad "Primeros Auxilios"
2. Activa botón de pánico
3. Contactos cercanos con primeros auxilios son notificados inmediatamente
4. También se registra para llamar al 911
5. Ayuda llega más rápido por respuesta comunitaria
```

### Caso 2: Residente con Situación de Seguridad
```
1. Tiene configurados contactos del sector con habilidad "Seguridad"
2. Activa botón con descripción específica
3. Miembros de seguridad del sector son notificados
4. Coordinan respuesta antes de llamar a policía si es necesario
5. Situación se resuelve más rápido
```

### Caso 3: Residente que No Configura Contactos
```
1. Entra a página de pánico sin configuración
2. Sistema lo redirige automáticamente a pestaña de Configuración
3. Muestra mensaje: "Primero configura tus contactos de emergencia"
4. Selecciona "Notificar a todos" como opción rápida
5. Ya puede usar el botón de pánico
```

## 🔄 Flujo de Datos

```
Usuario → Configuración
    ↓
Firestore (panicButtonSettings)
    ↓
Usuario activa pánico
    ↓
Sistema lee configuración
    ↓
Crea registro en panicReports
    ↓
Notifica a contactos seleccionados
    ↓
Actualiza historial del usuario
    ↓
Muestra confirmación y detalles
```

## 🎯 Próximas Mejoras Sugeridas

1. **Notificaciones Push**: Enviar notificaciones en tiempo real a los contactos
2. **Geolocalización automática**: Usar GPS del dispositivo para ubicación precisa
3. **Chat de emergencia**: Permitir comunicación entre usuario y contactos notificados
4. **Mapas interactivos**: Mostrar ubicación en mapa en tiempo real
5. **Estadísticas**: Panel con métricas de uso y tiempos de respuesta
6. **Roles de respuesta**: Asignar roles específicos a contactos (líder, apoyo, etc.)
7. **Integración con autoridades**: Envío automático a servicios de emergencia locales

## 📚 Documentos Relacionados

- [PLAN_SEGURIDAD_COMUNITARIA.md](./PLAN_SEGURIDAD_COMUNITARIA.md)
- [ROLES_SYSTEM.md](./ROLES_SYSTEM.md)
- [PERMISSIONS_SYSTEM.md](./PERMISSIONS_SYSTEM.md)
- [USER_FLOW.md](./USER_FLOW.md)

---

**Sistema de Botón de Pánico v2.0 - Calle Jerusalén Community** 🚨✨




