# ⚡ Test Rápido - Sistema Completo Plan de Seguridad

## 🚀 Inicio en 5 Minutos

### Paso 1: Iniciar Servidor
```bash
npm run dev
```

Espera ver:
```
✅ Firebase Admin inicializado correctamente
✅ Ready on http://localhost:3000
```

### Paso 2: Probar como Usuario Residente

#### 2.1 Login
```
URL: http://localhost:3000/login
Email: residente@demo.com
Contraseña: demo123
```

#### 2.2 Ir al Panel de Residentes
```
URL: http://localhost:3000/residentes
```

**Deberías ver:**
- ✅ Hero verde con mensaje: "Para acceder a funciones de seguridad..."
- ✅ Botón blanco: "Inscribirme en el Plan de Seguridad"
- ✅ Tarjetas de funciones bloqueadas con "🔒 Requiere Plan de Seguridad"

#### 2.3 Inscribirse en el Plan
```
1. Clic "Inscribirme en el Plan de Seguridad"
2. Modal se abre (fondo oscuro + modal blanco)
3. Verificar:
   ✅ Nombre pre-llenado (Juan Pérez o similar)
   ✅ Email pre-llenado (residente@demo.com)
   ✅ Campos bloqueados (no editables)
```

#### 2.4 Completar Formulario
```
Teléfono: +1 555-1234
Dirección: Calle Jerusalén #123
Disponibilidad: ○ Seleccionar "Tiempo Completo"
Habilidades: 
  ☑️ Primeros Auxilios
  ☑️ Médico/Enfermero
Términos: ☑️ Marcar checkbox
```

#### 2.5 Enviar
```
Clic "Inscribirme en el Plan"
```

**Deberías ver:**
- ✅ Botón cambia a "Inscribiendo..." con spinner
- ✅ Toast verde: "¡Tu solicitud ha sido enviada!"
- ✅ Modal se cierra
- ✅ Página recarga automáticamente
- ✅ Hero ahora muestra: "Tu solicitud está pendiente de aprobación"
- ✅ Badge amarillo: "⏳ Solicitud en Revisión"

#### 2.6 Intentar Acceder a Función Bloqueada
```
Clic en tarjeta "Botón de Pánico"
```

**Deberías ver:**
- 🚫 Toast rojo: "Tu inscripción está pendiente de aprobación"
- 🔄 Redirige a /residentes después de 2 segundos

---

### Paso 3: Probar como Administrador

#### 3.1 Cerrar Sesión y Login como Admin
```
Cerrar sesión del residente
URL: http://localhost:3000/login
Email: admin@callejerusalen.com
Contraseña: Admin123!@#
```

#### 3.2 Ir al Dashboard
```
URL: http://localhost:3000/admin/admin-dashboard
```

#### 3.3 Ir a Sección de Seguridad
```
Clic en pestaña "Seguridad" (icono de escudo)
```

**Deberías ver:**
- ✅ Sección "Plan de Seguridad de la Comunidad"
- ✅ 4 tarjetas con estadísticas:
  - Total: 1
  - Pendientes: 1
  - Aprobados: 0
  - Rechazados: 0
- ✅ Alerta amarilla: "Tienes 1 solicitud pendiente"
- ✅ Botón "Revisar Ahora" o "Gestionar Solicitudes"

#### 3.4 Acceder al Panel de Gestión
```
Clic "Gestionar Solicitudes"
O ir directo a: http://localhost:3000/admin/plan-seguridad
```

**Deberías ver:**
- ✅ Header: "Gestión del Plan de Seguridad" con Total: 1
- ✅ Filtros: [Todas] [Pendientes: 1] [Aprobadas: 0] [Rechazadas: 0]
- ✅ Tarjeta del usuario con:
  - Nombre: Residente Demo
  - Email: residente@demo.com
  - Teléfono: +1 555-1234
  - Dirección: Calle Jerusalén #123
  - Disponibilidad: Tiempo Completo
  - Habilidades: 🩹 ⚕️
  - Badge: "⏳ Pendiente"
  - 3 Botones: [Aprobar] [Rechazar] [Eliminar]

#### 3.5 Aprobar la Solicitud
```
1. Clic botón "Aprobar" (verde)
2. Confirmar en el diálogo
```

**Deberías ver:**
- ✅ Toast verde: "Inscripción aprobada exitosamente"
- ✅ Tarjeta se actualiza a badge "✅ Aprobado"
- ✅ Botones cambian (solo queda "Eliminar")
- ✅ Estadísticas actualizadas:
  - Pendientes: 0
  - Aprobados: 1

---

### Paso 4: Verificar Acceso del Usuario

#### 4.1 Volver como Usuario
```
Cerrar sesión del admin
Login: residente@demo.com
Ir a: /residentes
```

**Deberías ver:**
- ✅ Hero sin badge de pendiente
- ✅ Mensaje: "Tu seguridad es nuestra prioridad..."
- ✅ Tarjetas desbloqueadas (sin 🔒)
- ✅ Botón "Acceder →" en cada función

#### 4.2 Acceder a Función de Seguridad
```
Clic "Botón de Pánico"
URL: /residentes/panico
```

**Deberías ver:**
- ✅ Página carga correctamente
- ✅ NO hay redirección
- ✅ NO hay toast de error
- ✅ Sistema de pánico funcional

#### 4.3 Verificar Otras Funciones
```
/residentes/alertas → ✅ Funciona
/mapa → ✅ Funciona (siempre público)
```

---

## ✅ Checklist Completo

### Usuario
- [ ] Puede inscribirse
- [ ] Ve estado "pendiente"
- [ ] No puede acceder a funciones bloqueadas
- [ ] Ve mensaje de espera claro
- [ ] No puede volver a inscribirse
- [ ] Funciones se desbloquean al aprobar

### Admin
- [ ] Ve estadísticas en dashboard
- [ ] Ve alerta de pendientes
- [ ] Puede acceder a panel de gestión
- [ ] Ve información completa del usuario
- [ ] Puede aprobar
- [ ] Puede rechazar con razón
- [ ] Puede eliminar

### Sistema
- [ ] Modal se abre/cierra
- [ ] Validaciones funcionan
- [ ] API responde correctamente
- [ ] Firestore guarda datos
- [ ] Reglas protegen funciones
- [ ] Mensajes claros
- [ ] Loading states visibles
- [ ] Auto-refresh funciona

---

## 🧪 Tests Adicionales

### Test de Rechazo

```bash
# Como Usuario (otro)
Login con otro residente
Inscribirse en el plan

# Como Admin
Ir a /admin/plan-seguridad
Clic "Rechazar"
Razón: "Información incompleta"
Confirmar

# Como Usuario
Recargar /residentes
Verificar:
- ✅ Ve: "Tu solicitud fue rechazada"
- ✅ Ve razón: "Información incompleta"
- ✅ NO puede acceder a funciones
```

### Test de Eliminación

```bash
# Como Admin
Ir a /admin/plan-seguridad
Buscar solicitud rechazada
Clic "Eliminar Solicitud"
Confirmar

# Como Usuario
Recargar /residentes
Verificar:
- ✅ Ve botón "Inscribirme" de nuevo
- ✅ Puede volver a solicitar
```

---

## 🐛 Solución de Problemas

### Modal no se abre
**Solución:** Verificar consola del navegador, refrescar página

### Error 500 al inscribirse
**Solución:** Verificar que Firebase Admin está inicializado correctamente

### Usuario no ve cambios después de aprobación
**Solución:** Cerrar sesión y volver a iniciar sesión

### Alerta de pendientes no aparece
**Solución:** Verificar que hay solicitudes con status='pending'

---

## ⏱️ Tiempo Estimado

| Tarea | Tiempo |
|-------|--------|
| Iniciar servidor | 30 seg |
| Login como usuario | 30 seg |
| Inscribirse | 1 min |
| Login como admin | 30 seg |
| Aprobar solicitud | 30 seg |
| Verificar acceso | 30 seg |
| **TOTAL** | **~4 min** |

---

## 🎯 Resultado Esperado Final

✅ **Usuario inscrito y aprobado puede:**
- Acceder a Cámaras de Seguridad
- Usar Botón de Pánico
- Ver/Crear Alertas Comunitarias

✅ **Administrador puede:**
- Ver todas las solicitudes
- Aprobar usuarios verificados
- Rechazar con razones claras
- Eliminar solicitudes cuando necesario
- Ver estadísticas en tiempo real

✅ **Sistema garantiza:**
- Solo usuarios aprobados tienen acceso
- Información completa de cada residente
- Control administrativo total
- Seguridad en múltiples capas

---

**¡Listo para probar!** 🚀

Ejecuta `npm run dev` y sigue los pasos. Todo debería funcionar perfectamente.

