# ⚡ Prueba Rápida - Verificar Todo el Sistema

## 🎯 Guía Rápida de 5 Minutos

Esta guía te permite verificar que **TODAS** las mejoras funcionan correctamente.

---

## 🚀 Preparación

```bash
# Terminal 1: Iniciar servidor
npm run dev
```

---

## ✅ PRUEBA 1: Registro y Pending (3 minutos)

### Paso 1: Registrar Usuario

1. Ve a: http://localhost:3000/register

2. Completa:
   - **Nombre:** Prueba Final
   - **Email:** prueba-final@test.com
   - **Password:** test123456
   - **Confirmar:** test123456

3. Click **"Enviar Solicitud de Registro"**

4. **VERIFICA:**
   ```
   ✅ Toast verde: "¡Registro exitoso! Ahora inicia sesión..."
   ✅ URL cambia a: /login?registered=true
   ✅ Toast verde: "¡Bienvenido! Inicia sesión para continuar."
   ✅ Estás en la página de login
   ```

---

### Paso 2: Intentar Login (Debe Fallar)

1. En /login, ingresa:
   - **Email:** prueba-final@test.com
   - **Password:** test123456

2. Click **"Iniciar Sesión"**

3. **VERIFICA - BANNER AMARILLO:**
   ```
   ✅ Banner amarillo en la parte superior
   ✅ Icono: ⏳
   ✅ Mensaje: "⏳ Cuenta Pendiente de Aprobación: 
       Tu registro ha sido recibido correctamente..."
   ✅ Duración: 25 segundos
   ✅ Botón X para cerrar
   ✅ Barra de progreso moviéndose
   ```

4. **VERIFICA - CONSOLA (F12):**
   ```
   ✅ "🚨 USUARIO BLOQUEADO/PENDIENTE DETECTADO"
   ✅ "🔍 Código de error: auth/user-pending"
   ✅ "✅ Login permitido para usuario con status: pending"
   ```

---

### Paso 3: Aprobar Usuario

1. **Cierra sesión** (si estás logueado)

2. **Login como admin:**
   - Email: mar90jesus@gmail.com
   - Password: [tu password]

3. Ve a: http://localhost:3000/admin/super-admin/users

4. **Busca:** prueba-final@test.com

5. **VERIFICA:**
   ```
   ✅ Badge amarillo: "⏳ Pendiente"
   ✅ Botón "Aprobar" visible
   ```

6. **Click "Aprobar"**

7. **Confirma la aprobación**

8. **VERIFICA:**
   ```
   ✅ Badge cambia a: "✅ Activo"
   ✅ Estado: Activo
   ```

---

### Paso 4: Login Exitoso

1. **Cierra sesión del admin**

2. **Login con usuario de prueba:**
   - Email: prueba-final@test.com
   - Password: test123456

3. **VERIFICA:**
   ```
   ✅ Login EXITOSO
   ✅ Toast: "¡Bienvenido de vuelta!"
   ✅ SIN banner amarillo
   ✅ Puedes navegar libremente
   ✅ Tienes acceso a funciones de comunidad
   ```

---

## ✅ PRUEBA 2: Usuario Desactivado (1 minuto)

```bash
# Terminal 2
node scripts/quick-test-banner.js
```

**Sigue el script:**
1. Selecciona un usuario
2. Desactivar temporalmente
3. Intentar login
4. **VERIFICA banner:**
   ```
   ✅ Banner amarillo
   ✅ Mensaje: "🚫 Cuenta Desactivada: Tu cuenta ha sido 
       desactivada por un administrador..."
   ✅ Duración: 20 segundos
   ```
5. Reactivar usuario

---

## ✅ PRUEBA 3: Protección Super Admin (1 minuto)

```bash
node scripts/test-superadmin-protection.js
```

**VERIFICA:**
```
✅ Todas las pruebas pasan
✅ Super admin está protegido
✅ No puede ser modificado
✅ Reporte completo sin errores
```

---

## 📊 Checklist de Verificación Rápida

### Registro:
- [ ] Formulario muestra proceso de 6 pasos
- [ ] Registro exitoso
- [ ] Redirige a /login?registered=true
- [ ] Toasts de éxito aparecen

### Login Pending:
- [ ] Login es rechazado (correcto)
- [ ] Banner amarillo aparece
- [ ] Mensaje específico de "Cuenta Pendiente"
- [ ] Duración: 25 segundos
- [ ] Logs correctos en consola

### Aprobación:
- [ ] Usuario aparece como "Pendiente" en panel
- [ ] Botón "Aprobar" funciona
- [ ] Estado cambia a "Activo"

### Login Aprobado:
- [ ] Login es exitoso
- [ ] Sin banner amarillo
- [ ] Toast: "¡Bienvenido de vuelta!"
- [ ] Acceso completo

### Usuario Desactivado:
- [ ] Login es rechazado
- [ ] Banner amarillo aparece
- [ ] Mensaje específico de "Cuenta Desactivada"
- [ ] Duración: 20 segundos

### Super Admin:
- [ ] Todas las pruebas del script pasan
- [ ] No puede ser bloqueado
- [ ] UI muestra protección

---

## 🎨 Mensajes Esperados

### Durante el Flujo:

| Momento | Mensaje | Tipo | Duración |
|---------|---------|------|----------|
| Después de registro | "¡Registro exitoso!..." | Toast verde | 3s |
| Al llegar a login | "¡Bienvenido! Inicia sesión..." | Toast verde | 5s |
| Login pending | "⏳ Cuenta Pendiente..." | Banner amarillo | 25s |
| Login desactivado | "🚫 Cuenta Desactivada..." | Banner amarillo | 20s |
| Login eliminado | "🚫 Cuenta Eliminada..." | Banner rojo | 20s |
| Login aprobado | "¡Bienvenido de vuelta!" | Toast verde | 3s |

---

## 🔍 Logs Esperados en Consola

### Registro:
```
📝 Iniciando proceso de registro...
✅ Usuario registrado exitosamente
🚪 Cerrando sesión para redirigir al login...
⏳ Esperando para asegurar logout completo...
↪️ Redirigiendo al login...
```

### Login Pending:
```
📞 Llamando a loginUser...
🔍 Estado de registro verificado: pending
❌ ERROR CAPTURADO EN CATCH
  - error.code: auth/user-pending
🚨 USUARIO BLOQUEADO/PENDIENTE DETECTADO
🔍 Código de error: auth/user-pending
⏳ Usuario con status PENDING - Sesión permitida: [email]
✅ showAlert ejecutado
```

### Login Aprobado:
```
📞 Llamando a loginUser...
🔍 Estado de registro verificado: approved
✅ Login permitido para usuario con status: active
✅ loginUser retornó: { registrationStatus: 'approved', ... }
```

---

## ⚠️ Si Algo Falla

### Banner no aparece:
1. Verifica logs en consola (F12)
2. Busca: "🚨 USUARIO BLOQUEADO/PENDIENTE"
3. Si NO está: el error no se detectó
4. Si SÍ está: problema con el banner component

### No redirige a login:
1. Busca en consola: "↪️ Redirigiendo al login..."
2. Si NO está: error durante registro
3. Si SÍ está: problema con router

### Login pending es permitido:
1. Verifica en Firestore: `status` debe ser `'pending'`
2. Busca en logs: "Login permitido para usuario con status:"
3. Debe decir "pending" y luego rechazar

---

## 🎉 ¡Listo!

Si todos los checkboxes están marcados, el sistema funciona perfectamente.

**Total de tiempo:** ~5 minutos  
**Resultado esperado:** ✅ Todo funcionando

---

**Última actualización:** 8 de octubre de 2025  
**Estado:** ✅ LISTO PARA PROBAR

