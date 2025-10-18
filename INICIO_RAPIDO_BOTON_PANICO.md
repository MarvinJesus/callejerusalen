# 🚀 Inicio Rápido - Sistema de Botón de Pánico Configurado

## ✨ ¿Qué se ha implementado?

La página `/residentes/panico` ahora es un **sistema completo de configuración y gestión de emergencias** con las siguientes características:

### 🎯 Características Principales

1. **Configuración de Contactos**
   - Selección de usuarios específicos del plan de seguridad
   - Visualización de información detallada (nombre, email, teléfono, sector, habilidades)
   - Opción de notificar a todos los miembros del plan
   - Configuración de ubicación y mensaje predeterminados

2. **Botón de Pánico Mejorado**
   - Notifica a contactos configurados
   - Countdown de 5 segundos para cancelar
   - Información específica de ubicación y descripción
   - Contador de personas que serán notificadas

3. **Historial de Alertas**
   - Visualización de todas las alertas enviadas
   - Estado de cada alerta
   - Número de personas notificadas
   - Detalles completos de cada emergencia

## 🧪 Cómo Probar el Sistema

### Paso 1: Iniciar el Servidor
```bash
npm run dev
```

### Paso 2: Acceder como Usuario del Plan de Seguridad
```
1. Ve a: http://localhost:3000/login
2. Inicia sesión con una cuenta que esté en el Plan de Seguridad
3. Debe tener estado "active" en securityRegistrations
```

### Paso 3: Acceder al Sistema de Pánico
```
1. Ve a: http://localhost:3000/residentes/panico
2. Verás tres pestañas: Configuración, Botón de Pánico, Historial
```

### Paso 4: Configurar Contactos de Emergencia
```
1. En la pestaña "Configuración":
   - Verás la lista de usuarios activos del plan de seguridad
   - Selecciona los contactos que quieres notificar
   - O activa "Notificar a todos"
   - Configura ubicación y mensaje (opcional)
   - Presiona "Guardar Configuración"
```

### Paso 5: Probar el Botón de Pánico
```
1. Ve a la pestaña "Botón de Pánico"
2. Verás cuántos contactos serán notificados
3. Ingresa ubicación y descripción específica (opcional)
4. Presiona "ACTIVAR ALERTA DE PÁNICO"
5. Tendrás 5 segundos para cancelar
6. La alerta se enviará y se guardará en el historial
```

### Paso 6: Ver Historial
```
1. Ve a la pestaña "Historial"
2. Verás todas tus alertas anteriores
3. Cada alerta muestra:
   - Fecha y hora
   - Ubicación
   - Descripción
   - Número de personas notificadas
   - Estado (Activo/Resuelto)
```

## 🔐 Requisitos de Acceso

Para acceder al sistema, el usuario debe:

✅ Estar autenticado
✅ Tener rol 'comunidad', 'admin' o 'super_admin'
✅ Estar inscrito en el Plan de Seguridad (`securityRegistrations`)
✅ Tener estado 'active' en el plan de seguridad

**Nota:** Los administradores y super administradores tienen acceso automático sin necesidad de estar inscritos.

## 📊 Estructura de Datos

### Colección: panicButtonSettings
```
Documento por usuario (ID = userId)
- emergencyContacts: string[]  // IDs de usuarios seleccionados
- notifyAll: boolean           // Si se notifica a todos
- customMessage: string        // Mensaje personalizado
- location: string             // Ubicación predeterminada
```

### Colección: panicReports
```
Documento por alerta
- userId: string               // Quien activó la alerta
- userName: string
- userEmail: string
- location: string             // Ubicación de la emergencia
- description: string          // Descripción de la emergencia
- timestamp: Timestamp
- status: 'active' | 'resolved'
- notifiedUsers: string[]      // IDs de usuarios notificados
```

## 🎨 Interfaz de Usuario

### Pestaña 1: Configuración
- Lista completa de usuarios del plan de seguridad
- Información detallada de cada usuario:
  - Nombre completo
  - Email
  - Teléfono
  - Sector de la comunidad
  - Habilidades (Primeros Auxilios, Seguridad, etc.)
- Checkbox para notificar a todos
- Campos para ubicación y mensaje predeterminados
- Botón de guardar con indicador de carga

### Pestaña 2: Botón de Pánico
- Botón rojo grande de activación
- Información de contactos configurados
- Campos opcionales para ubicación y descripción específicas
- Countdown visual de 5 segundos
- Botón de cancelación

### Pestaña 3: Historial
- Tarjetas con información de cada alerta
- Iconos visuales de estado
- Formato de fecha relativo ("Hace 2 horas")
- Badge de estado colorido

## 🎯 Casos de Uso Comunes

### Caso 1: Usuario Nuevo
```
1. Entra a la página → Ve pestaña de Configuración primero
2. Selecciona 3-5 contactos cercanos o con habilidades útiles
3. Guarda configuración
4. Ya puede usar el botón de pánico
```

### Caso 2: Usuario con Emergencia
```
1. Va directo a "Botón de Pánico"
2. Opcional: Ingresa ubicación y descripción específica
3. Presiona botón
4. Sistema notifica a sus contactos configurados
5. Alerta se guarda en historial automáticamente
```

### Caso 3: Usuario Revisa Historial
```
1. Va a "Historial"
2. Ve todas sus alertas anteriores
3. Verifica cuántas personas fueron notificadas
4. Puede revisar ubicaciones y descripciones
```

## 🔧 Funciones Implementadas

### En `lib/auth.ts`

#### `getActiveSecurityPlanUsers()`
Obtiene todos los usuarios activos del plan de seguridad.

#### `savePanicButtonSettings(userId, settings)`
Guarda la configuración del botón de pánico de un usuario.

#### `getPanicButtonSettings(userId)`
Obtiene la configuración guardada del botón de pánico.

### En la Página

#### Estados Principales
- `securityUsers`: Lista de usuarios del plan
- `selectedContacts`: IDs de contactos seleccionados
- `notifyAll`: Boolean para notificar a todos
- `customMessage`: Mensaje personalizado
- `userLocation`: Ubicación predeterminada
- `recentReports`: Historial de alertas

## 🔒 Reglas de Firestore Actualizadas

### Nuevas Reglas Agregadas

```javascript
// securityRegistrations - Lectura para usuarios con acceso al plan
allow read: if hasSecurityAccess();

// panicButtonSettings - Nueva colección
match /panicButtonSettings/{userId} {
  allow create, read, update: if request.auth.uid == userId;
  allow delete: if request.auth.uid == userId || isAdminOrSuperAdmin();
  allow read: if isAdminOrSuperAdmin();
}
```

## 🚀 Deployment

### Antes de Desplegar
1. Asegúrate de que las reglas de Firestore estén actualizadas
2. Verifica que haya usuarios activos en `securityRegistrations`
3. Prueba el flujo completo en local

### Para Desplegar
```bash
# Desplegar reglas de Firestore
firebase deploy --only firestore:rules

# Desplegar aplicación (Vercel)
vercel --prod
```

## 📱 Prueba Rápida

### Test 1: Configuración
```
1. Login → /residentes/panico
2. Debe abrir en pestaña "Configuración"
3. Debe mostrar lista de usuarios del plan
4. Seleccionar algunos usuarios
5. Guardar → Debe mostrar toast de éxito
```

### Test 2: Activación de Pánico
```
1. Ir a pestaña "Botón de Pánico"
2. Debe mostrar número de contactos configurados
3. Presionar botón → Countdown de 5 segundos
4. Dejar que termine → Debe crear alerta
5. Debe redirigir a "Historial" automáticamente
```

### Test 3: Cancelación
```
1. Ir a "Botón de Pánico"
2. Presionar botón → Inicia countdown
3. Presionar "CANCELAR" → Debe detenerse
4. No debe crear alerta en historial
```

### Test 4: Historial
```
1. Ir a pestaña "Historial"
2. Debe mostrar alertas anteriores
3. Cada alerta debe tener toda la información
4. Debe mostrar estado y número de notificados
```

## ⚠️ Notas Importantes

1. **Primera vez**: Los usuarios deben configurar sus contactos antes de usar el botón de pánico
2. **Validación**: Si intentan activar sin configurar, se les redirige a Configuración
3. **Tiempo de cancelación**: 5 segundos es tiempo suficiente para prevenir activaciones accidentales
4. **Notificar a todos**: Útil para emergencias graves que requieren máxima respuesta

## 🎉 ¡Listo para Usar!

El sistema está completamente funcional y listo para producción. Los usuarios del plan de seguridad pueden ahora:

- ✅ Configurar sus contactos de emergencia preferidos
- ✅ Priorizar contactos cercanos o con habilidades específicas
- ✅ Activar alertas de emergencia personalizadas
- ✅ Ver historial completo de alertas
- ✅ Tener mayor control sobre quién responde a sus emergencias

---

**¿Preguntas o problemas?** Consulta [SISTEMA_BOTON_PANICO.md](./SISTEMA_BOTON_PANICO.md) para documentación completa.









