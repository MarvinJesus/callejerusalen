# 🔐 Flujo de Aprobación - Plan de Seguridad Comunitaria

## 📋 Resumen

Se ha implementado un **sistema completo de aprobación por administrador** para el Plan de Seguridad. Los usuarios ahora deben ser aprobados por un administrador antes de acceder a las funciones de seguridad.

## 🎯 Flujo Completo

```
1. Usuario Residente
   ↓
   Se inscribe al Plan de Seguridad (completa formulario)
   ↓
2. Sistema
   ↓
   Guarda inscripción con status = 'pending'
   ↓
3. Administrador
   ↓
   Revisa solicitud en panel de administración
   ↓
   Decide: Aprobar o Rechazar
   ↓
4. Sistema
   ↓
   Si APROBAR: status = 'approved' → Usuario tiene acceso
   Si RECHAZAR: status = 'rejected' → Usuario NO tiene acceso
   ↓
5. Usuario
   ↓
   APROBADO: Puede acceder a cámaras, pánico, alertas ✅
   RECHAZADO: Ve mensaje de rechazo ❌
   PENDIENTE: Ve mensaje de espera ⏳
```

## 🏗️ Estructura de Datos

### UserProfile.securityPlan

```typescript
securityPlan: {
  enrolled: boolean;              // true si se inscribió
  enrolledAt: Date;              // Fecha de inscripción
  agreedToTerms: boolean;        // Aceptó términos
  phoneNumber: string;           // Teléfono
  address: string;               // Dirección
  availability: string;          // Disponibilidad
  skills: string[];              // Habilidades
  otherSkills: string;           // Otras habilidades
  
  // NUEVO: Sistema de aprobación
  status: 'pending' | 'approved' | 'rejected';  // Estado
  approvedBy?: string;           // UID del admin que aprobó
  approvedAt?: Date;             // Fecha de aprobación
  rejectedBy?: string;           // UID del admin que rechazó
  rejectedAt?: Date;             // Fecha de rechazo
  rejectionReason?: string;      // Razón del rechazo
}
```

## 📝 Estados Posibles

### 1. **pending** ⏳
- Usuario acaba de inscribirse
- Esperando revisión del administrador
- NO tiene acceso a funciones de seguridad
- Ve mensaje: "Solicitud en Revisión"

### 2. **approved** ✅
- Administrador aprobó la solicitud
- Usuario TIENE acceso a funciones de seguridad
- Puede usar cámaras, pánico, alertas
- Ve mensaje normal de bienvenida

### 3. **rejected** ❌
- Administrador rechazó la solicitud
- NO tiene acceso a funciones de seguridad
- Ve razón del rechazo (si se proporcionó)
- Puede volver a solicitar

## 🔌 API Endpoints

### POST /api/security-plan/enroll

**Inscribirse al plan (usuario)**

```typescript
// Request
{
  uid: string,
  agreedToTerms: boolean,
  phoneNumber: string,
  address: string,
  availability: string,
  skills: string[],
  otherSkills?: string
}

// Response (Success)
{
  success: true,
  message: "¡Tu solicitud ha sido enviada! Un administrador la revisará pronto.",
  securityPlan: {
    enrolled: true,
    status: 'pending',  // ← Siempre 'pending' al inicio
    ...otherData
  }
}
```

### POST /api/security-plan/approve

**Aprobar/Rechazar solicitud (admin)**

```typescript
// Request (Aprobar)
{
  uid: string,          // Usuario a aprobar
  adminUid: string,     // Admin que aprueba
  action: 'approve'
}

// Request (Rechazar)
{
  uid: string,          // Usuario a rechazar
  adminUid: string,     // Admin que rechaza
  action: 'reject',
  rejectionReason?: string  // Opcional
}

// Response (Success)
{
  success: true,
  message: "Inscripción aprobada exitosamente",
  action: "approve",
  userEmail: "usuario@email.com",
  userName: "Nombre Usuario"
}
```

## 🖥️ Panel de Administración

### Ubicación
`/admin/plan-seguridad`

### Características

1. **Filtros de Estado**
   - Todas
   - Pendientes ⏳
   - Aprobadas ✅
   - Rechazadas ❌

2. **Información Mostrada**
   - Nombre y correo del usuario
   - Teléfono y dirección
   - Disponibilidad seleccionada
   - Habilidades declaradas
   - Fecha de solicitud
   - Estado actual

3. **Acciones Disponibles**
   - Botón **"Aprobar"** (verde)
   - Botón **"Rechazar"** (rojo)
   - Confirmación antes de acción

4. **Solo Accesible Por**
   - Administradores (`role: 'admin'`)
   - Super Administradores (`role: 'super_admin'`)

## 👤 Experiencia del Usuario

### Caso 1: Usuario Se Inscribe

```
1. Clic en "Inscribirme en el Plan de Seguridad"
2. Modal se abre
3. Completa formulario (teléfono, dirección, disponibilidad, habilidades)
4. Acepta términos
5. Clic "Inscribirme en el Plan"
6. ✅ Toast: "¡Tu solicitud ha sido enviada! Un administrador la revisará pronto."
7. Modal se cierra
8. Página recarga
```

### Caso 2: Usuario con Solicitud Pendiente

**Hero Section muestra:**
```
Tu solicitud al Plan de Seguridad de la Comunidad está 
pendiente de aprobación por un administrador.
Te notificaremos cuando sea revisada.

[⏳ Solicitud en Revisión]
```

**Intenta acceder a función de seguridad:**
```
🚫 Toast: "Tu inscripción está pendiente de aprobación por un administrador"
→ Redirige a /residentes
```

### Caso 3: Usuario Aprobado

**Hero Section muestra:**
```
Tu seguridad es nuestra prioridad. Accede a todas las herramientas 
de monitoreo y comunicación de la comunidad.
```

**Puede acceder a:**
- ✅ Cámaras de Seguridad
- ✅ Botón de Pánico
- ✅ Alertas Comunitarias

### Caso 4: Usuario Rechazado

**Hero Section muestra:**
```
Tu solicitud al Plan de Seguridad fue rechazada.
Razón: [Razón proporcionada por el admin]
Puedes contactar al administrador para más información.

[Botón: Volver a Solicitar]
```

**Intenta acceder a función de seguridad:**
```
🚫 Toast: "Tu inscripción fue rechazada. Contacta al administrador"
→ Redirige a /residentes
```

## 👨‍💼 Experiencia del Administrador

### Acceder al Panel

```bash
1. Login como admin/super_admin
2. Ir a: /admin/plan-seguridad
3. Ver dashboard con todas las solicitudes
```

### Revisar Solicitud

```
1. Ver tarjeta de usuario
   - Información completa
   - Habilidades
   - Disponibilidad
   
2. Analizar datos
   - ¿Es residente legítimo?
   - ¿Información verídica?
   - ¿Habilidades útiles?

3. Tomar decisión
```

### Aprobar Solicitud

```
1. Clic botón "Aprobar"
2. Confirmar acción
3. ✅ Sistema actualiza:
   - status = 'approved'
   - approvedBy = UID admin
   - approvedAt = Fecha actual

4. Usuario ahora tiene acceso completo
```

### Rechazar Solicitud

```
1. Clic botón "Rechazar"
2. Ingresar razón (opcional pero recomendado)
3. Confirmar acción
4. ❌ Sistema actualiza:
   - status = 'rejected'
   - rejectedBy = UID admin
   - rejectedAt = Fecha actual
   - rejectionReason = Razón ingresada

5. Usuario ve razón del rechazo
```

## 🔒 Validaciones de Seguridad

### Frontend (Cliente)

```typescript
// app/residentes/page.tsx
const isEnrolledInSecurityPlan = 
  userProfile?.securityPlan?.enrolled && 
  userProfile?.securityPlan?.status === 'approved';
```

### Backend (API)

```typescript
// app/api/security-plan/approve/route.ts
// Verifica que quien aprueba sea admin o super_admin
if (adminData.role !== 'admin' && adminData.role !== 'super_admin') {
  return error 403
}
```

### Database (Firestore Rules)

```javascript
function isEnrolledInSecurityPlan() {
  return request.auth != null && 
    get(...).data.securityPlan.enrolled == true &&
    get(...).data.securityPlan.status == 'approved';
}
```

## 📊 Contadores y Estadísticas

El panel de administración muestra:

- **Total de solicitudes:** Todas las inscripciones
- **Pendientes:** Esperando aprobación ⏳
- **Aprobadas:** Usuarios con acceso ✅
- **Rechazadas:** Solicitudes denegadas ❌

## 🧪 Cómo Probar

### Test 1: Inscripción y Aprobación

```bash
# Terminal 1: Usuario residente
1. Login: residente@demo.com
2. Ir a /residentes
3. Clic "Inscribirme en el Plan de Seguridad"
4. Completar formulario
5. Verificar mensaje "pendiente"

# Terminal 2: Admin
6. Login: admin@callejerusalen.com
7. Ir a /admin/plan-seguridad
8. Ver solicitud pendiente
9. Clic "Aprobar"

# Terminal 1: Usuario residente
10. Recargar página
11. ✅ Ver que ahora puede acceder a funciones
12. Acceder a /residentes/panico (funciona)
```

### Test 2: Inscripción y Rechazo

```bash
# Usuario
1. Inscribirse al plan
2. Esperar revisión

# Admin
3. Ir a panel
4. Clic "Rechazar"
5. Ingresar razón: "Información incompleta"

# Usuario
6. Recargar página
7. ❌ Ver mensaje de rechazo con razón
8. Intentar acceder a /residentes/panico → Bloqueado
```

## 📁 Archivos Creados/Modificados

### Nuevos
1. `app/api/security-plan/approve/route.ts` - API de aprobación
2. `app/admin/plan-seguridad/page.tsx` - Panel de admin
3. `FLUJO_APROBACION_PLAN_SEGURIDAD.md` - Esta documentación

### Modificados
1. `lib/auth.ts` - Campos adicionales en securityPlan
2. `app/api/security-plan/enroll/route.ts` - Guardar como 'pending'
3. `app/residentes/page.tsx` - Mensajes según estado
4. `app/residentes/panico/page.tsx` - Verificar aprobación
5. `app/residentes/alertas/page.tsx` - Verificar aprobación
6. `firestore.rules` - Requerir status = 'approved'

## 🎨 Estados Visuales

### Pendiente ⏳
```
Color: Amarillo
Ícono: Clock
Mensaje: "Solicitud en Revisión"
Acceso: NO
```

### Aprobado ✅
```
Color: Verde
Ícono: Check
Mensaje: "Bienvenido al Plan"
Acceso: SÍ
```

### Rechazado ❌
```
Color: Rojo
Ícono: X
Mensaje: "Solicitud Rechazada + Razón"
Acceso: NO
```

## 🔄 Flujo de Estados

```
[No Inscrito]
     ↓ (Se inscribe)
[Pendiente] ⏳
     ↓
   Admin decide
     ↓
    / \
   /   \
Aprobar Rechazar
  ↓       ↓
[Aprobado] [Rechazado]
    ✅        ❌
             ↓ (Puede volver a solicitar)
         [Pendiente] ⏳
```

## ⚠️ Puntos Importantes

1. **Admin/Super Admin NO necesitan aprobación**
   - Tienen acceso automático a todas las funciones
   - No ven formulario de inscripción

2. **Usuario puede volver a solicitar**
   - Si fue rechazado, puede enviar nueva solicitud
   - Nueva solicitud también pasa por aprobación

3. **Razón de rechazo es opcional**
   - Pero se recomienda proporcionar una
   - Ayuda al usuario a entender

4. **Todas las acciones se registran**
   - approvedBy/rejectedBy guarda el UID del admin
   - approvedAt/rejectedAt guarda la fecha
   - Trazabilidad completa

## 🚀 Deploy

### Antes de Deploy
```bash
# Desplegar nuevas reglas de Firestore
firebase deploy --only firestore:rules
```

### Verificar
- [ ] Reglas de Firestore desplegadas
- [ ] API endpoints funcionan
- [ ] Panel de admin accesible
- [ ] Mensajes de estado correctos

## 📞 Soporte

Si hay problemas:
1. Verificar rol del usuario
2. Verificar estado de inscripción en Firestore
3. Revisar logs del servidor
4. Confirmar reglas de Firestore desplegadas

---

**¡Flujo de aprobación completo e implementado!** ✅

El sistema ahora requiere aprobación administrativa antes de otorgar acceso a funciones de seguridad, mejorando el control y seguridad de la comunidad.

