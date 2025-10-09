# Funcionalidad: Login con Usuario Pendiente

## 🎯 Descripción

Se ha implementado una funcionalidad que muestra un mensaje informativo cuando un usuario con registro pendiente intenta iniciar sesión. El usuario no puede acceder completamente a la aplicación hasta que su registro sea aprobado por un administrador.

## ✅ Funcionalidades Implementadas

### 1. **Verificación de Estado de Registro**
- ✅ La función `loginUser()` ahora verifica el estado de registro después del login
- ✅ Retorna información sobre el estado: `pending`, `rejected`, `approved`, o `not_found`
- ✅ Incluye el perfil del usuario para mostrar información detallada

### 2. **Componente de Alert de Estado**
- ✅ `RegistrationStatusAlert` - Modal informativo que se muestra según el estado
- ✅ Diferentes vistas para cada estado (pendiente, rechazado, aprobado)
- ✅ Información detallada del usuario y su solicitud
- ✅ Acciones específicas según el estado

### 3. **Página de Login Actualizada**
- ✅ Detecta automáticamente el estado de registro después del login
- ✅ Muestra el alert correspondiente
- ✅ Maneja diferentes flujos según el estado

### 4. **Contexto de Autenticación Mejorado**
- ✅ Logging detallado del estado de registro
- ✅ Detección automática de usuarios pendientes o rechazados

## 🎨 Tipos de Alert Implementados

### **Estado Pendiente** (`pending`)
- 🟡 **Color**: Amarillo
- 📝 **Mensaje**: "Tu solicitud de registro está siendo revisada"
- ℹ️ **Información**: Explica qué sucede ahora y cuánto tiempo puede tomar
- 🔧 **Acciones**: 
  - "Explorar como Visitante" - Cierra el alert y permite navegación limitada
  - "Cerrar Sesión" - Regresa al login

### **Estado Rechazado** (`rejected`)
- 🔴 **Color**: Rojo
- 📝 **Mensaje**: "Tu solicitud de registro no fue aprobada"
- ℹ️ **Información**: Muestra la razón del rechazo (si está disponible)
- 🔧 **Acciones**:
  - "Intentar Registro Nuevamente" - Va a la página de registro
  - "Explorar como Visitante" - Cierra el alert

### **Estado Aprobado** (`approved`)
- 🟢 **Color**: Verde
- 📝 **Mensaje**: "Tu solicitud ha sido aprobada. Redirigiendo..."
- 🔧 **Acción**: Se cierra automáticamente y redirige al sistema

## 🚀 Cómo Probar la Funcionalidad

### Paso 1: Crear Usuario de Prueba
```bash
# Crear usuario con estado pendiente
npm run test-pending-login
```

Este script:
- Crea un usuario en Firebase Auth
- Crea perfil con estado `pending` en Firestore
- Crea solicitud de registro
- Te proporciona las credenciales para probar

### Paso 2: Probar en la Aplicación
1. **Inicia el servidor:**
   ```bash
   npm run dev
   ```

2. **Ve al login:**
   ```
   http://localhost:3000/login
   ```

3. **Usa las credenciales del script de prueba:**
   - Email: `test-pending-[timestamp]@example.com`
   - Password: `Test123!@#`

4. **Resultado esperado:**
   - Login exitoso
   - Aparece alert amarillo con estado pendiente
   - Información del usuario mostrada
   - Opciones para explorar como visitante o cerrar sesión

### Paso 3: Probar Diferentes Estados

#### **Usuario Pendiente:**
- Usa las credenciales del script de prueba
- Deberías ver el alert amarillo

#### **Usuario Rechazado:**
- En Firebase Console, cambia `registrationStatus` a `rejected`
- Agrega `statusReason` con una razón
- Intenta hacer login nuevamente

#### **Usuario Aprobado:**
- En Firebase Console, cambia `registrationStatus` a `approved`
- Intenta hacer login - debería redirigir normalmente

## 🔧 Flujo Técnico

### 1. **Usuario hace Login**
```javascript
const loginResult = await loginUser(email, password);
```

### 2. **Verificación de Estado**
```javascript
if (loginResult.registrationStatus === 'pending') {
  // Mostrar alert de pendiente
} else if (loginResult.registrationStatus === 'rejected') {
  // Mostrar alert de rechazado
} else if (loginResult.registrationStatus === 'approved') {
  // Redirigir normalmente
}
```

### 3. **Mostrar Alert Correspondiente**
```javascript
<RegistrationStatusAlert
  status={registrationStatus}
  userProfile={userProfile}
  onClose={handleCloseRegistrationAlert}
/>
```

## 📋 Información Mostrada en el Alert

### **Información del Usuario:**
- ✅ Nombre completo
- ✅ Email
- ✅ Fecha de solicitud
- ✅ Razón del rechazo (si aplica)

### **Acciones Disponibles:**
- ✅ Explorar como visitante
- ✅ Cerrar sesión
- ✅ Intentar registro nuevamente (para rechazados)
- ✅ Continuar al sistema (para aprobados)

## 🎯 Beneficios de esta Implementación

### **Para el Usuario:**
1. **Transparencia**: Sabe exactamente el estado de su solicitud
2. **Orientación**: Entiende qué puede hacer mientras espera
3. **Flexibilidad**: Puede explorar la comunidad como visitante
4. **Información**: Ve detalles de su solicitud y fechas

### **Para la Administración:**
1. **Control**: Los usuarios no pueden acceder sin aprobación
2. **Claridad**: Los usuarios entienden el proceso
3. **Reducción de consultas**: Menos preguntas sobre el estado
4. **Experiencia mejorada**: Flujo más profesional

### **Para el Sistema:**
1. **Seguridad**: Acceso controlado hasta aprobación
2. **Logging**: Registro completo de estados
3. **Escalabilidad**: Fácil de mantener y extender
4. **Robustez**: Manejo de todos los estados posibles

## 🐛 Solución de Problemas

### **El alert no aparece:**
1. Verifica que el usuario tenga `registrationStatus: 'pending'` en Firestore
2. Revisa la consola del navegador para errores
3. Asegúrate de que el servidor esté ejecutándose

### **El usuario no puede hacer login:**
1. Verifica que el usuario exista en Firebase Auth
2. Verifica que el perfil exista en Firestore
3. Revisa las reglas de Firestore

### **El estado no se actualiza:**
1. Refresca la página después de cambiar el estado en Firebase
2. Verifica que el contexto de autenticación se actualice
3. Revisa los logs en la consola

## 📞 Soporte

Para problemas o preguntas:
1. Ejecuta `npm run test-pending-login` para crear usuario de prueba
2. Revisa los logs en la consola del navegador
3. Verifica el estado en Firebase Console
4. Consulta la documentación de Firebase Auth y Firestore

Esta funcionalidad mejora significativamente la experiencia del usuario al proporcionar información clara sobre el estado de su solicitud de registro y opciones para interactuar con la comunidad mientras espera la aprobación.
