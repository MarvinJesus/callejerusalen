# Flujo de Alerta Global para Registro Pendiente

## 📋 Descripción

Este documento describe el flujo implementado para mostrar una alerta global amarilla a los usuarios cuyo registro está pendiente de aprobación por un administrador.

## 🎯 Objetivo

Cuando un usuario se registra exitosamente, si su registro no ha sido confirmado por un administrador, el sistema debe mostrar una alerta global amarilla (estilo Bootstrap) en **TODAS las páginas** que informe al usuario sobre el estado de su solicitud. Esta alerta debe permanecer visible hasta que el administrador confirme el registro.

## ✅ Flujo Implementado

### 1. Registro de Usuario

**Página:** `http://localhost:3000/register`

**Flujo:**
1. El usuario completa el formulario de registro con:
   - Nombre completo
   - Email
   - Contraseña
   - Confirmación de contraseña

2. Al enviar el formulario:
   - Se crea el usuario en Firebase Authentication
   - Se crea el perfil en Firestore con `registrationStatus: 'pending'`
   - El usuario queda **automáticamente autenticado**
   - Se muestra un toast verde: *"¡Registro exitoso! Tu solicitud está pendiente de aprobación por un administrador."*
   - Se redirige a la página principal (`/`)

3. En la página principal:
   - ✅ **Aparece la alerta global amarilla en la parte superior**
   - El usuario puede navegar por el sitio
   - La alerta persiste en todas las páginas

### 2. Login con Registro Pendiente

**Página:** `http://localhost:3000/login`

**Flujo:**
1. El usuario ingresa sus credenciales (email y contraseña)

2. Al iniciar sesión:
   - Se verifica el `registrationStatus` del usuario
   - Si es `'pending'`:
     - El usuario **permanece autenticado** (no se cierra la sesión)
     - Se muestra un toast verde: *"Inicio de sesión exitoso. Tu registro está pendiente de aprobación."*
     - Se redirige a la página principal (`/`)
   
3. En la página principal:
   - ✅ **Aparece la alerta global amarilla en la parte superior**
   - El usuario puede navegar por el sitio
   - La alerta persiste en todas las páginas

### 3. Login con Registro Rechazado

**Flujo:**
1. Si el `registrationStatus` es `'rejected'`:
   - El usuario **permanece autenticado**
   - Se muestra un toast rojo: *"Tu solicitud de registro fue rechazada. Puedes intentar registrarte nuevamente."*
   - Se redirige a la página principal (`/`)

2. En la página principal:
   - ✅ **Aparece una alerta global roja en la parte superior**
   - Se muestra el motivo del rechazo (si fue proporcionado)
   - El usuario puede intentar registrarse nuevamente

## 🎨 Componente de Alerta Global

### Componente: `GlobalRegistrationAlert.tsx`

**Ubicación:** `components/GlobalRegistrationAlert.tsx`

**Características:**
- Se renderiza en el layout principal (`app/layout.tsx`)
- Es un componente de posición fija (`fixed`) en la parte superior
- Aparece en **TODAS las páginas** de la aplicación
- No se puede cerrar manualmente (persiste hasta que el admin apruebe)

**Tipos de Alerta:**

#### 🟡 Alerta Amarilla (Pendiente)
```
┌────────────────────────────────────────────────────┐
│ 🕐 Solicitud de Registro Pendiente                 │
│ Tu solicitud está siendo revisada por un admin...  │
│                    [Explorar como Visitante]       │
└────────────────────────────────────────────────────┘
```

#### 🔴 Alerta Roja (Rechazado)
```
┌────────────────────────────────────────────────────┐
│ ❌ Solicitud de Registro Rechazada                 │
│ [Razón del rechazo]                                │
│                    [Intentar de Nuevo]             │
└────────────────────────────────────────────────────┘
```

## 🔧 Archivos Modificados

### 1. `components/GlobalRegistrationAlert.tsx` (Nuevo)
- Componente de alerta global
- Se muestra cuando `isRegistrationPending` o `isRegistrationRejected` es `true`
- Agrega padding automático al body para que el contenido no quede oculto

### 2. `app/layout.tsx`
- Importa `GlobalRegistrationAlert`
- Renderiza el componente en el layout principal
- La alerta aparece antes del contenido de las páginas

### 3. `app/register/page.tsx`
- Modificado para que el usuario permanezca autenticado después del registro
- Redirige a `/` en lugar de `/login`
- El usuario ve la alerta global inmediatamente

### 4. `app/login/page.tsx`
- Modificado para que usuarios con registro pendiente o rechazado permanezcan autenticados
- Ya no cierra la sesión para estos usuarios
- Redirige a `/` donde verán la alerta global

### 5. `context/AuthContext.tsx` (Sin cambios)
- Ya detecta correctamente `isRegistrationPending` y `isRegistrationRejected`
- Proporciona estos estados a todos los componentes

## 📝 Estados de Registro

### Estado del Usuario en Firestore

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  registrationStatus?: 'pending' | 'approved' | 'rejected';
  statusReason?: string; // Razón del rechazo (opcional)
  approvedBy?: string; // UID del admin que aprobó
  approvedAt?: Date; // Fecha de aprobación
  createdAt: Date;
  updatedAt: Date;
  // ... otros campos
}
```

### Flujo de Estados

```
┌──────────────┐
│   Registro   │
└──────┬───────┘
       │
       v
┌──────────────┐      ┌──────────────┐
│   Pending    │ ───> │   Approved   │  ✅ Usuario tiene acceso completo
└──────┬───────┘      └──────────────┘
       │
       v
┌──────────────┐      ┌──────────────┐
│   Rejected   │ ───> │ Nuevo Intento│  🔄 Usuario puede registrarse de nuevo
└──────────────┘      └──────────────┘
```

## 🧪 Cómo Probar

### Prueba 1: Registro Nuevo

1. Ir a `http://localhost:3000/register`
2. Llenar el formulario con datos válidos
3. Click en "Enviar Solicitud de Registro"
4. **Verificar:**
   - ✅ Toast verde de éxito
   - ✅ Redirección automática a `/`
   - ✅ Alerta global amarilla visible en la parte superior
   - ✅ La alerta dice "Solicitud de Registro Pendiente"

5. Navegar a diferentes páginas (`/visitantes`, `/mapa`, etc.)
6. **Verificar:**
   - ✅ La alerta amarilla persiste en todas las páginas

### Prueba 2: Login con Registro Pendiente

1. Registrar un usuario nuevo (siguiendo Prueba 1)
2. Cerrar sesión
3. Ir a `http://localhost:3000/login`
4. Ingresar credenciales del usuario con registro pendiente
5. Click en "Iniciar Sesión"
6. **Verificar:**
   - ✅ Toast verde: "Inicio de sesión exitoso..."
   - ✅ Redirección automática a `/`
   - ✅ Alerta global amarilla visible
   - ✅ Usuario permanece autenticado

### Prueba 3: Aprobación por Admin

1. Como super admin, ir a `http://localhost:3000/admin/super-admin/users`
2. Buscar el usuario con registro pendiente
3. Aprobar el registro
4. **Verificar:**
   - ✅ El usuario recibe notificación (si está implementado)
   
5. Como el usuario aprobado, recargar la página
6. **Verificar:**
   - ✅ La alerta amarilla desaparece
   - ✅ El usuario tiene acceso completo al sistema

### Prueba 4: Rechazo por Admin

1. Como super admin, rechazar un registro pendiente
2. Proporcionar una razón del rechazo
3. Como el usuario rechazado, recargar la página
4. **Verificar:**
   - ✅ Alerta roja aparece
   - ✅ Se muestra la razón del rechazo
   - ✅ Botón "Intentar de Nuevo" visible

## 🎨 Estilos

### Clases CSS de Tailwind

```css
/* Alerta Pendiente (Amarilla) */
.bg-yellow-500       /* Fondo amarillo */
.border-yellow-600   /* Borde amarillo oscuro */
.text-white          /* Texto blanco */

/* Alerta Rechazada (Roja) */
.bg-red-500         /* Fondo rojo */
.border-red-600     /* Borde rojo oscuro */
.text-white         /* Texto blanco */

/* Posicionamiento */
.fixed              /* Posición fija */
.top-0              /* Arriba */
.left-0 .right-0    /* Ancho completo */
.z-50               /* Por encima de todo */
```

### Padding Automático

El componente agrega automáticamente un padding de `80px` al body cuando la alerta está visible, para que el contenido no quede oculto detrás de ella.

## 🔒 Seguridad

- Los usuarios con registro pendiente pueden navegar pero tienen acceso limitado
- Las rutas protegidas verifican el `registrationStatus`
- Los middleware de permisos validan el estado del usuario
- Solo los administradores pueden aprobar/rechazar registros

## 📱 Responsive

La alerta es responsive y se adapta a diferentes tamaños de pantalla:
- **Desktop:** Muestra todos los botones y textos
- **Mobile:** Oculta algunos botones secundarios y ajusta el tamaño del texto

## ✅ Checklist de Implementación

- [x] Componente `GlobalRegistrationAlert` creado
- [x] Integración en el layout principal
- [x] Modificación del flujo de registro
- [x] Modificación del flujo de login
- [x] Detección automática del estado en `AuthContext`
- [x] Padding automático para el contenido
- [x] Estilos responsive
- [x] Alerta para registro pendiente (amarilla)
- [x] Alerta para registro rechazado (roja)
- [x] Botones de acción en las alertas
- [x] Persistencia de la alerta en todas las páginas

## 🎉 Resultado Final

Cuando un usuario se registra exitosamente o inicia sesión con un registro pendiente, verá una **alerta global amarilla persistente** en la parte superior de **TODAS las páginas** que le informa que su solicitud está siendo revisada. Esta alerta:

- ✅ Es visible en todas las páginas
- ✅ No se puede cerrar manualmente
- ✅ Permanece hasta que el admin apruebe el registro
- ✅ Tiene estilo Bootstrap (fondo amarillo, borde, iconos)
- ✅ Es responsive y adaptable
- ✅ Incluye información útil para el usuario
- ✅ Proporciona acciones rápidas (explorar como visitante, intentar de nuevo)

---

**Autor:** Sistema de Gestión de Usuarios  
**Fecha:** Octubre 2025  
**Versión:** 1.0

