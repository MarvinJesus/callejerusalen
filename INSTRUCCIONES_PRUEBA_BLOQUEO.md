# Instrucciones para Probar el Bloqueo de Usuarios

## ✅ Problema Resuelto

Se ha implementado la verificación de estado de usuarios para **prevenir que usuarios bloqueados, desactivados o eliminados puedan iniciar sesión**.

## 🔧 Cambios Implementados

### 1. **lib/auth.ts** - Función `loginUser`
- ✅ Verifica el estado del usuario ANTES de permitir el inicio de sesión
- ✅ Cierra sesión automáticamente si el usuario está inactivo o eliminado
- ✅ Lanza errores específicos según el estado del usuario

### 2. **context/AuthContext.tsx** - Verificación en tiempo real
- ✅ Verifica el estado del usuario cuando se carga la sesión
- ✅ Desconecta automáticamente usuarios con estado inválido
- ✅ Previene que usuarios desactivados mantengan sesión activa

### 3. **app/login/page.tsx** - Mensajes de error
- ✅ Muestra mensajes específicos para cada tipo de bloqueo
- ✅ Guía al usuario a contactar al administrador
- ✅ Muestra banner global amarillo durante 5 segundos para usuarios bloqueados

### 4. **Sistema de Banner Global** (NUEVO)
- ✅ Banner amarillo visible en todas las páginas
- ✅ Duración de 5 segundos con barra de progreso
- ✅ Cierre manual con botón X
- ✅ Mensaje claro y específico del bloqueo
- ✅ Icono de advertencia contextual

## 🧪 Cómo Probar

### Opción 1: Usando el Script de Prueba (Recomendado)

1. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **En otra terminal, ejecutar el script de prueba:**
   ```bash
   node scripts/test-blocked-user-login.js
   ```

3. **Seguir las instrucciones del script:**
   - Ingresar el email de un usuario de prueba
   - Seleccionar una opción (desactivar, eliminar, activar)
   - Intentar iniciar sesión en http://localhost:3000/login
   - Verificar que el mensaje de error es el esperado

### Opción 2: Prueba Manual

#### 2.1 Crear Usuario de Prueba

```bash
node scripts/create-test-user.js
```

Ejemplo de usuario de prueba:
- Email: `test@example.com`
- Contraseña: `Test123456`

#### 2.2 Probar Desactivación

1. Abrir Firebase Console o usar el script:
   ```bash
   node scripts/test-blocked-user-login.js
   ```

2. Cambiar el estado del usuario a `inactive`

3. Intentar iniciar sesión en http://localhost:3000/login

4. **Resultado esperado:**
   - Banner amarillo en la parte superior con el mensaje:
   ```
   🚫 Acceso Denegado: Esta cuenta ha sido desactivada. 
      Contacta al administrador para más información.
   ```
   - El banner debe:
     * Ser de color amarillo
     * Durar 5 segundos
     * Tener una barra de progreso animada
     * Permitir cierre manual con botón X
     * Tener un icono de advertencia

#### 2.3 Probar Eliminación

1. Cambiar el estado del usuario a `deleted`

2. Intentar iniciar sesión

3. **Resultado esperado:**
   - Banner amarillo en la parte superior con el mensaje:
   ```
   🚫 Acceso Denegado: Esta cuenta ha sido eliminada. 
      Contacta al administrador si crees que es un error.
   ```
   - El banner debe aparecer durante 5 segundos con animación de barra de progreso

#### 2.4 Probar Reactivación

1. Cambiar el estado del usuario a `active`

2. Intentar iniciar sesión

3. **Resultado esperado:**
   ```
   ✅ ¡Bienvenido de vuelta!
   ```

### Opción 3: Prueba de Sesión Activa

1. **Iniciar sesión con un usuario normal**

2. **Mientras tienes la sesión activa:**
   - Usar el script o Firebase Console para desactivar el usuario
   - Cambiar su `status` a `inactive` o `deleted`

3. **Recargar la página** (F5)

4. **Resultado esperado:**
   - La sesión se cierra automáticamente
   - El usuario es redirigido al login o página principal

## 📊 Estados de Usuario

| Estado | isActive | ¿Puede iniciar sesión? | Mensaje de Error |
|--------|----------|------------------------|------------------|
| `active` | `true` | ✅ SÍ | - |
| `inactive` | `false` | ❌ NO | "Cuenta desactivada" |
| `deleted` | `false` | ❌ NO | "Cuenta eliminada" |

## 🔒 Seguridad

### Verificaciones Implementadas

1. **Al Iniciar Sesión (loginUser):**
   - Verifica `status === 'active'`
   - Verifica `isActive === true`
   - Cierra sesión si no cumple requisitos

2. **Al Cargar Sesión (AuthContext):**
   - Verifica estado en cada carga de página
   - Desconecta automáticamente usuarios con estado inválido
   - Previene acceso a usuarios desactivados durante sesión activa

3. **En Firestore Rules:**
   - Solo usuarios con `status: 'active'` pueden acceder a datos

## 📝 Códigos de Error

| Código | Descripción | Cuándo ocurre |
|--------|-------------|---------------|
| `auth/user-deleted` | Cuenta eliminada | Usuario con `status: 'deleted'` |
| `auth/user-disabled` | Cuenta desactivada | Usuario con `status: 'inactive'` o `isActive: false` |
| `auth/user-not-active` | Cuenta no activa | Usuario con `status` diferente a `active` |

## 🎯 Casos de Uso Verificados

### ✅ Caso 1: Login Bloqueado
```
Usuario inactivo → Intenta login → ❌ Error específico
```

### ✅ Caso 2: Sesión Activa Desactivada
```
Usuario activo con sesión → Admin desactiva → Recarga página → ❌ Sesión cerrada
```

### ✅ Caso 3: Usuario Reactivado
```
Usuario inactivo → Admin reactiva → Intenta login → ✅ Acceso permitido
```

## 🐛 Debugging

Si encuentras problemas, verifica:

1. **Consola del navegador:**
   ```javascript
   // Deberías ver logs como:
   "🔍 Estado de registro verificado: approved"
   "🔍 Perfil de usuario: {...}"
   "⚠️ Usuario con estado inválido detectado"
   ```

2. **Estado en Firestore:**
   ```javascript
   // Verifica que el documento del usuario tenga:
   {
     status: 'active' | 'inactive' | 'deleted',
     isActive: true | false,
     registrationStatus: 'approved' | 'pending' | 'rejected'
   }
   ```

3. **Firebase Auth:**
   ```javascript
   // El usuario debe existir en Firebase Auth
   // disabled: false
   ```

## 📚 Documentación Adicional

- Ver `SOLUCION_BLOQUEO_USUARIOS_LOGIN.md` para detalles técnicos
- Ver `SISTEMA_ESTADOS_USUARIOS.md` para información sobre estados

## ✅ Checklist de Pruebas

- [ ] Usuario con `status: 'inactive'` NO puede iniciar sesión
- [ ] Usuario con `status: 'deleted'` NO puede iniciar sesión
- [ ] Usuario con `isActive: false` NO puede iniciar sesión
- [ ] Usuario con `status: 'active'` puede iniciar sesión normalmente
- [ ] Usuario con sesión activa es desconectado si se desactiva
- [ ] Banner amarillo aparece para usuarios bloqueados
- [ ] Banner dura exactamente 5 segundos
- [ ] Banner muestra barra de progreso animada
- [ ] Banner se puede cerrar manualmente con botón X
- [ ] Banner muestra icono de advertencia
- [ ] Banner es visible en todas las páginas
- [ ] Mensajes de error son claros y específicos
- [ ] No hay errores en la consola del navegador
- [ ] El script de prueba funciona correctamente

## 🚀 Próximos Pasos

1. **Probar en ambiente local:**
   ```bash
   npm run dev
   node scripts/test-blocked-user-login.js
   ```

2. **Verificar funcionamiento:**
   - Probar cada caso de uso
   - Verificar mensajes de error
   - Confirmar que sesiones activas se cierran

3. **Si todo funciona correctamente:**
   - Hacer commit de los cambios
   - Desplegar a producción
   - Notificar al equipo

---

**Estado:** ✅ IMPLEMENTADO Y LISTO PARA PROBAR  
**Fecha:** 8 de octubre de 2025

