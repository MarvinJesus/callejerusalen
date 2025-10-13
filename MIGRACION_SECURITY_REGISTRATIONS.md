# Migración del Plan de Seguridad a Colección Separada

## 📋 Resumen

Se ha migrado el sistema de registro del Plan de Seguridad desde un campo anidado en los documentos de usuario (`users/{userId}.securityPlan`) a una colección separada `securityRegistrations`. Esto mejora la estructura de datos y facilita la consulta y gestión de los registros.

## 🔄 Cambios Realizados

### 1. API de Inscripción (`/api/security-plan/enroll/route.ts`)

**Antes:**
- Guardaba el registro en `users/{userId}.securityPlan`
- Verificaba duplicados en el campo del usuario

**Ahora:**
- Crea documentos en la colección `securityRegistrations`
- Cada registro es un documento independiente con:
  - `userId`: referencia al usuario
  - `userDisplayName`: nombre del usuario
  - `userEmail`: email del usuario
  - `phoneNumber`: teléfono de contacto
  - `address`: dirección
  - `availability`: disponibilidad
  - `skills`: habilidades seleccionadas
  - `otherSkills`: otras habilidades
  - `status`: 'pending' | 'active' | 'rejected'
  - `submittedAt`: fecha de envío
  - `reviewedBy`: admin que revisó
  - `reviewedAt`: fecha de revisión
  - `reviewNotes`: notas de revisión

### 2. API de Aprobación/Rechazo (`/api/security-plan/approve/route.ts`)

**Antes:**
- Actualizaba `users/{userId}.securityPlan.status`

**Ahora:**
- Busca el documento en `securityRegistrations` por `userId`
- Actualiza el estado del documento (`active` o `rejected`)
- Registra quién revisó y cuándo

### 3. API de Eliminación (`/api/security-plan/delete/route.ts`)

**Antes:**
- Eliminaba el campo `securityPlan` del documento del usuario

**Ahora:**
- Busca y elimina el documento en `securityRegistrations`

### 4. Reglas de Firestore (`firestore.rules`)

**Actualizado:**
```javascript
match /securityRegistrations/{registrationId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null && 
    (resource.data.userId == request.auth.uid || 
     isAdminOrSuperAdmin() || 
     hasSecurityAccess());
  allow update, delete: if isAdminOrSuperAdmin();
}
```

- **Crear**: Cualquier usuario autenticado (el backend verifica que el userId coincida)
- **Leer**: El dueño del registro, admins, o usuarios con acceso al plan
- **Actualizar/Eliminar**: Solo admins y super_admins

### 5. Scripts Actualizados

#### `scripts/enroll-user-security-plan.js`
- Ahora crea registros en `securityRegistrations` en lugar de modificar el usuario
- Inscribe automáticamente con estado 'active'

#### `scripts/check-user-security-status.js`
- Ya estaba actualizado para verificar ambas ubicaciones
- Útil para verificar el estado de la migración

#### `scripts/clean-security-plan-field.js`
- Script para limpiar el campo obsoleto `securityPlan` de los usuarios
- Ejecutar después de migrar todos los registros

## 🔧 Sistema Existente (Sin Cambios)

Los siguientes componentes ya estaban configurados para usar `securityRegistrations`:

- **AuthContext**: Carga el plan de seguridad desde `securityRegistrations` usando `getUserSecurityPlanStatus()`
- **lib/auth.ts**: 
  - `getUserSecurityPlanStatus()`: busca en `securityRegistrations`
  - `getActiveSecurityPlanUsers()`: obtiene todos los registros activos
  - `isUserEnrolledInSecurityPlan()`: verifica estado del usuario
- **Componentes del Frontend**: Usan el contexto de autenticación que ya lee de `securityRegistrations`

## 📊 Estructura de Datos

### Colección `securityRegistrations`

```typescript
{
  id: string; // ID del documento (autogenerado)
  userId: string; // ID del usuario en la colección users
  userDisplayName: string;
  userEmail: string;
  phoneNumber: string;
  address: string;
  availability: 'full_time' | 'part_time' | 'emergencies_only' | 'weekends';
  skills: string[]; // ['first_aid', 'doctor', 'firefighter', etc.]
  otherSkills?: string;
  status: 'pending' | 'active' | 'rejected';
  sector?: string;
  submittedAt: Timestamp;
  reviewedBy?: string; // userId del admin que revisó
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🚀 Flujo de Inscripción

1. **Usuario se inscribe** (modal en `/residentes`)
   - Completa el formulario con teléfono, dirección, disponibilidad y habilidades
   - Se crea documento en `securityRegistrations` con `status: 'pending'`

2. **Admin revisa la solicitud**
   - Ve las solicitudes pendientes en el panel de administración
   - Aprueba (`status: 'active'`) o rechaza (`status: 'rejected'`)
   - Registra notas de revisión si es necesario

3. **Usuario obtiene acceso**
   - Si está aprobado (`status: 'active'`), obtiene acceso a:
     - Botón de Pánico
     - Alertas Comunitarias
     - Cámaras de Seguridad (cuando se implemente)

## ✅ Ventajas de la Migración

1. **Mejor Organización**: Los registros tienen su propia colección, no anidados en usuarios
2. **Consultas Eficientes**: Fácil obtener todos los registros activos, pendientes o rechazados
3. **Escalabilidad**: Soporta múltiples registros si se necesita en el futuro
4. **Auditoría**: Cada registro tiene timestamps y registra quién lo revisó
5. **Flexibilidad**: Más campos disponibles sin inflar los documentos de usuario
6. **Índices**: Firestore puede indexar mejor la colección separada

## 📝 Tareas Post-Migración

### Opcional: Limpiar Campo Obsoleto

Si hay usuarios con el campo `securityPlan` antiguo, ejecutar:

```bash
node scripts/clean-security-plan-field.js
```

Este script eliminará el campo `securityPlan` de todos los usuarios.

### Verificar Estado de un Usuario

Para verificar el estado de un usuario específico:

```bash
node scripts/check-user-security-status.js
```

Este script mostrará:
- Si el usuario tiene el campo obsoleto `securityPlan`
- Si tiene registro en `securityRegistrations`
- El estado actual del registro

## 🔍 Testing

Para probar el flujo completo:

1. **Inscripción**:
   - Ir a `http://localhost:3000/residentes`
   - Hacer clic en "Inscribirme en el Plan de Seguridad"
   - Completar el formulario
   - Verificar que se crea el documento en `securityRegistrations`

2. **Aprobación**:
   - Iniciar sesión como admin
   - Ir al panel de administración
   - Aprobar o rechazar la solicitud
   - Verificar que se actualiza el estado

3. **Acceso**:
   - Iniciar sesión como usuario aprobado
   - Verificar acceso a funciones de seguridad
   - Verificar que usuarios pendientes/rechazados no tienen acceso

## 📚 Referencias

- **API Endpoints**: 
  - POST `/api/security-plan/enroll` - Inscribirse
  - GET `/api/security-plan/enroll?uid={userId}` - Verificar estado
  - POST `/api/security-plan/approve` - Aprobar/Rechazar
  - POST `/api/security-plan/delete` - Eliminar registro
  - GET `/api/security-registrations` - Listar todos

- **Contexto**: `context/AuthContext.tsx`
- **Utilidades**: `lib/auth.ts`
- **Componentes**: `components/SecurityPlanModal.tsx`

## 🎉 Conclusión

La migración está completa y el sistema ahora usa correctamente la colección `securityRegistrations`. Los usuarios pueden inscribirse normalmente desde el frontend, y los registros se guardan en la ubicación correcta.

