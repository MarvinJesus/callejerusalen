# 🧪 Guía de Prueba - Plan de Seguridad Comunitaria

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de inscripción al **Plan de Seguridad de la Comunidad Calle Jerusalén** donde los residentes deben inscribirse para acceder a funciones de seguridad.

## ✅ Lo que se ha implementado

### 1. **Estructura de Datos**
- ✅ Nuevo campo `securityPlan` en `UserProfile`
- ✅ Incluye: `enrolled`, `enrolledAt`, `agreedToTerms`

### 2. **API Endpoint**
- ✅ `POST /api/security-plan/enroll` - Inscribir usuario
- ✅ `GET /api/security-plan/enroll?uid=<uid>` - Verificar inscripción

### 3. **Página de Inscripción**
- ✅ `/residentes/seguridad/inscribirse`
- ✅ Diseño moderno y atractivo
- ✅ Explicación de beneficios
- ✅ Términos y condiciones
- ✅ Inscripción con un clic

### 4. **Panel de Residentes**
- ✅ Banner informativo para usuarios no inscritos
- ✅ Tarjetas de funciones con indicador de "Requiere Plan"
- ✅ Redirección a inscripción desde tarjetas bloqueadas

### 5. **Protección de Rutas**
- ✅ Verificación en páginas de pánico
- ✅ Verificación en páginas de alertas
- ✅ Redirección automática si no está inscrito

### 6. **Reglas de Firestore**
- ✅ Función `isEnrolledInSecurityPlan()`
- ✅ Función `hasSecurityAccess()`
- ✅ Protección en `panicReports`, `alerts`, `cameras`

### 7. **Scripts de Utilidad**
- ✅ Script para inscribir usuarios individuales
- ✅ Script para inscribir todos los residentes

## 🧪 Pasos para Probar

### Opción 1: Probar con Usuario Existente

1. **Iniciar sesión como residente**
   ```
   Email: residente@demo.com
   Contraseña: demo123
   ```

2. **Navegar al panel de residentes**
   - Ir a: `http://localhost:3000/residentes`
   - Deberías ver un **banner naranja** indicando que debes inscribirte

3. **Intentar acceder a función de seguridad**
   - Haz clic en "Botón de Pánico" o "Alertas Comunitarias"
   - Deberías ver que están bloqueadas con mensaje "Requiere Plan de Seguridad"

4. **Inscribirte en el plan**
   - Haz clic en "Inscribirme Ahora" en el banner
   - O haz clic en "Inscribirme en el plan →" en una tarjeta bloqueada
   - Lee los beneficios y términos
   - Marca la casilla de aceptación
   - Haz clic en "Inscribirme en el Plan de Seguridad"

5. **Verificar acceso**
   - Serás redirigido al panel de residentes
   - El banner naranja debería desaparecer
   - Las tarjetas de seguridad deberían estar desbloqueadas
   - Podrás acceder a todas las funciones

### Opción 2: Inscribir con Script

```bash
# Inscribir un usuario específico
node scripts/enroll-user-security-plan.js residente@demo.com

# Inscribir todos los residentes
node scripts/enroll-user-security-plan.js --all
```

### Opción 3: Crear Nuevo Usuario

1. **Registrarse como nuevo residente**
   - Ir a: `http://localhost:3000/register`
   - Completar el formulario
   - Esperar aprobación del super admin

2. **Iniciar sesión**
   - Una vez aprobado, iniciar sesión

3. **Seguir pasos del Opción 1**

## 🔍 Qué Verificar

### ✅ Checklist de Pruebas

- [ ] **Banner de Inscripción**
  - [ ] Aparece solo para usuarios no inscritos
  - [ ] Desaparece después de inscribirse
  - [ ] Tiene enlace funcional a la página de inscripción

- [ ] **Tarjetas de Funciones**
  - [ ] Muestran "Requiere Plan de Seguridad" cuando no está inscrito
  - [ ] Tienen enlace a la inscripción
  - [ ] Se desbloquean después de inscribirse

- [ ] **Página de Inscripción**
  - [ ] Carga correctamente
  - [ ] Muestra todos los beneficios
  - [ ] Términos son visibles y legibles
  - [ ] Checkbox funciona correctamente
  - [ ] Botón se habilita solo al aceptar términos
  - [ ] Muestra mensaje de éxito
  - [ ] Redirecciona después de inscribirse

- [ ] **Protección de Rutas**
  - [ ] Redirige desde `/residentes/panico` si no inscrito
  - [ ] Redirige desde `/residentes/alertas` si no inscrito
  - [ ] Permite acceso después de inscribirse

- [ ] **Usuarios Admin/Super Admin**
  - [ ] No ven el banner de inscripción
  - [ ] Tienen acceso directo a todas las funciones
  - [ ] No necesitan inscribirse

- [ ] **API Endpoints**
  - [ ] POST funciona correctamente
  - [ ] GET retorna estado correcto
  - [ ] Validaciones funcionan

## 🎯 Escenarios de Prueba

### Escenario 1: Usuario Nuevo
```
1. Registrarse → 2. Ser Aprobado → 3. Iniciar Sesión 
→ 4. Ver Banner → 5. Inscribirse → 6. Acceder a Funciones ✅
```

### Escenario 2: Usuario Existente
```
1. Iniciar Sesión → 2. Ver Banner → 3. Inscribirse 
→ 4. Acceder a Funciones ✅
```

### Escenario 3: Inscripción Masiva
```
1. Ejecutar Script → 2. Todos los residentes inscritos ✅
```

### Escenario 4: Admin/Super Admin
```
1. Iniciar Sesión → 2. Acceso Directo (sin inscripción) ✅
```

## 🐛 Problemas Comunes y Soluciones

### Problema: "Usuario no encontrado"
**Solución:** Verifica que el usuario esté registrado y aprobado en el sistema.

### Problema: "Error al inscribirse"
**Solución:** 
1. Verifica que el usuario tenga rol "comunidad"
2. Verifica que el usuario esté "active"
3. Revisa los logs del servidor

### Problema: Banner sigue apareciendo después de inscribirse
**Solución:**
1. Refresca la página (F5)
2. Cierra sesión y vuelve a iniciar
3. Verifica en Firestore que el campo `securityPlan.enrolled = true`

### Problema: Reglas de Firestore bloquean acceso
**Solución:**
```bash
# Desplegar nuevas reglas
firebase deploy --only firestore:rules
```

## 📊 Datos de Prueba

### Usuarios de Demo

| Email | Contraseña | Rol | Inscrito |
|-------|------------|-----|----------|
| residente@demo.com | demo123 | comunidad | ❌ (Inscribir) |
| visitante@demo.com | demo123 | visitante | N/A |
| admin@callejerusalen.com | Admin123!@# | super_admin | N/A (No necesita) |

## 🔧 Comandos Útiles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Inscribir usuario específico
node scripts/enroll-user-security-plan.js residente@demo.com

# Inscribir todos los residentes
node scripts/enroll-user-security-plan.js --all

# Ver logs del servidor
# (Revisar la terminal donde corre npm run dev)

# Desplegar reglas de Firestore
firebase deploy --only firestore:rules
```

## 📝 Notas Importantes

1. **Admins y Super Admins** tienen acceso automático, NO necesitan inscribirse
2. **Visitantes** NO pueden inscribirse (no son residentes)
3. El estado de inscripción se sincroniza automáticamente
4. La inscripción es **permanente** (no hay forma de desinscribirse desde la UI)
5. Los cambios en Firestore pueden tardar unos segundos en propagarse

## ✨ Características Destacadas

- 🎨 **Diseño Moderno:** Interfaz atractiva y profesional
- 🔒 **Seguridad Robusta:** Validaciones en múltiples niveles
- 📱 **Responsive:** Funciona en móvil, tablet y desktop
- ⚡ **Rápido:** Inscripción instantánea
- 🎯 **Intuitivo:** Flujo claro y fácil de seguir
- 🛡️ **Protegido:** Múltiples capas de verificación

## 🎉 Resultado Esperado

Después de completar la inscripción:
- ✅ Banner naranja desaparece
- ✅ Todas las funciones de seguridad desbloqueadas
- ✅ Acceso completo a cámaras, pánico y alertas
- ✅ Mensaje de bienvenida al plan
- ✅ Usuario forma parte de la red de seguridad comunitaria

## 📸 Capturas Esperadas

### Antes de Inscribirse:
- Banner naranja prominente en panel de residentes
- Tarjetas de funciones con icono de candado
- Mensaje "Requiere Plan de Seguridad"

### Durante la Inscripción:
- Página de inscripción con beneficios listados
- Términos visibles en caja de scroll
- Botón de inscripción deshabilitado hasta aceptar términos

### Después de Inscribirse:
- Mensaje de éxito verde
- Redirección al panel de residentes
- Todas las funciones desbloqueadas
- Banner desaparecido

---

**¡Listo para probar!** 🚀

Si encuentras algún problema, revisa los logs del servidor y verifica que las reglas de Firestore estén desplegadas correctamente.

