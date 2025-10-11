# ⚡ Inicio Rápido - Plan de Seguridad Comunitaria

## 🚀 En 5 Minutos

### Paso 1: Iniciar el Servidor
```bash
npm run dev
```

### Paso 2: Inscribir Usuarios de Demo
```bash
# Opción A: Inscribir usuario específico
npm run security-plan:enroll residente@demo.com

# Opción B: Inscribir todos los residentes
npm run security-plan:enroll-all
```

### Paso 3: Probar la Funcionalidad

1. **Abrir navegador**
   ```
   http://localhost:3000
   ```

2. **Iniciar sesión como residente**
   ```
   Email: residente@demo.com
   Contraseña: demo123
   ```

3. **Ir al panel de residentes**
   ```
   http://localhost:3000/residentes
   ```

4. **Verificar**
   - ✅ Banner naranja visible (si no inscrito)
   - ✅ Funciones bloqueadas con "Requiere Plan de Seguridad"
   - ✅ Clic en "Inscribirme Ahora"
   - ✅ Completar inscripción
   - ✅ Funciones desbloqueadas

## 📋 Checklist Rápido

### Antes de Empezar
- [ ] Node.js instalado
- [ ] Firebase configurado
- [ ] Variables de entorno (.env.local) configuradas
- [ ] Dependencias instaladas (`npm install`)

### Verificar Implementación
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Firebase conectado correctamente
- [ ] Usuarios de demo existen en Firestore
- [ ] Reglas de Firestore desplegadas

### Probar Funcionalidad
- [ ] Banner aparece para usuarios no inscritos
- [ ] Página de inscripción carga correctamente
- [ ] Inscripción funciona (muestra éxito)
- [ ] Funciones se desbloquean después de inscribir
- [ ] Admin/Super Admin tienen acceso directo

## 🎯 URLs Importantes

| Página | URL | Descripción |
|--------|-----|-------------|
| Panel Residentes | `/residentes` | Vista principal con banner |
| Inscripción | `/residentes/seguridad/inscribirse` | Página para inscribirse |
| Botón de Pánico | `/residentes/panico` | Requiere inscripción |
| Alertas | `/residentes/alertas` | Requiere inscripción |
| Mapa | `/mapa` | Acceso público |

## 🔑 Usuarios de Prueba

```
Residente:
Email: residente@demo.com
Contraseña: demo123
Estado: Requiere inscripción

Super Admin:
Email: admin@callejerusalen.com
Contraseña: Admin123!@#
Estado: Acceso directo (sin inscripción)
```

## ⚙️ Comandos Útiles

```bash
# Desarrollo
npm run dev                          # Iniciar servidor

# Plan de Seguridad
npm run security-plan:enroll <email>  # Inscribir usuario
npm run security-plan:enroll-all      # Inscribir todos

# Firebase
firebase deploy --only firestore:rules # Desplegar reglas

# Scripts individuales
node scripts/enroll-user-security-plan.js residente@demo.com
node scripts/enroll-user-security-plan.js --all
```

## 🐛 Solución Rápida de Problemas

### Problema: Usuario no se inscribe
```bash
# Verificar que el usuario existe y está activo
node scripts/enroll-user-security-plan.js <email>
```

### Problema: Banner sigue apareciendo
```bash
# Refrescar la página o cerrar/abrir sesión
# O verificar en Firestore que securityPlan.enrolled = true
```

### Problema: Reglas bloquean acceso
```bash
# Desplegar reglas actualizadas
firebase deploy --only firestore:rules
```

### Problema: Error al cargar página
```bash
# Verificar que el servidor está corriendo
npm run dev

# Verificar variables de entorno
# Asegúrate que .env.local tiene todas las keys de Firebase
```

## 📂 Archivos Clave

```
app/
├── api/
│   └── security-plan/
│       └── enroll/
│           └── route.ts          ← API de inscripción
├── residentes/
│   ├── page.tsx                  ← Panel con banner
│   ├── panico/page.tsx          ← Botón de pánico (protegido)
│   ├── alertas/page.tsx         ← Alertas (protegido)
│   └── seguridad/
│       └── inscribirse/
│           └── page.tsx          ← Página de inscripción

lib/
└── auth.ts                       ← UserProfile con securityPlan

scripts/
└── enroll-user-security-plan.js  ← Script de inscripción

firestore.rules                   ← Reglas de seguridad

Documentación/
├── PLAN_SEGURIDAD_COMUNITARIA.md
├── PRUEBA_PLAN_SEGURIDAD.md
├── RESUMEN_PLAN_SEGURIDAD.md
└── INICIO_RAPIDO_PLAN_SEGURIDAD.md (este archivo)
```

## ✅ Test Rápido (2 minutos)

### Opción 1: UI Manual
1. Login como residente
2. Ver banner naranja
3. Clic "Inscribirme Ahora"
4. Aceptar términos
5. Clic "Inscribirme en el Plan"
6. Verificar mensaje de éxito
7. Volver al panel
8. Verificar funciones desbloqueadas

### Opción 2: Script Automático
```bash
# Inscribir usuario
npm run security-plan:enroll residente@demo.com

# Iniciar sesión y verificar en UI
```

## 🎉 Resultado Esperado

### Antes de Inscribirse:
```
┌─────────────────────────────────────┐
│  Panel de Residentes                │
├─────────────────────────────────────┤
│  🟠 BANNER NARANJA                  │
│  "Plan de Seguridad de la Comunidad"│
│  [Inscribirme Ahora]                │
├─────────────────────────────────────┤
│  🎥 Cámaras     🔒 Requiere Plan    │
│  🚨 Pánico      🔒 Requiere Plan    │
│  📢 Alertas     🔒 Requiere Plan    │
│  🗺️ Mapa       ✅ Disponible        │
└─────────────────────────────────────┘
```

### Después de Inscribirse:
```
┌─────────────────────────────────────┐
│  Panel de Residentes                │
├─────────────────────────────────────┤
│  🎥 Cámaras     ✅ [Acceder →]      │
│  🚨 Pánico      ✅ [Acceder →]      │
│  📢 Alertas     ✅ [Acceder →]      │
│  🗺️ Mapa       ✅ [Acceder →]      │
└─────────────────────────────────────┘
```

## 🔗 Enlaces Rápidos a Documentación

- 📖 [Documentación Completa](./PLAN_SEGURIDAD_COMUNITARIA.md)
- 🧪 [Guía de Pruebas](./PRUEBA_PLAN_SEGURIDAD.md)
- 📊 [Resumen Ejecutivo](./RESUMEN_PLAN_SEGURIDAD.md)

## 💡 Tips Importantes

1. **Admin/Super Admin NO necesitan inscribirse**
   - Tienen acceso automático a todas las funciones
   
2. **Visitantes NO pueden inscribirse**
   - Solo residentes (rol 'comunidad')

3. **La inscripción es permanente**
   - No hay forma de desinscribirse desde la UI
   - Solo admins pueden modificar en Firestore

4. **Sincronización puede tardar**
   - Refrescar página si los cambios no aparecen inmediatamente

## ⏱️ Tiempo Estimado

| Tarea | Tiempo |
|-------|--------|
| Setup inicial | 2 min |
| Inscribir usuarios | 1 min |
| Probar en UI | 2 min |
| **Total** | **~5 min** |

## 🎯 Listo!

Si completaste estos pasos, el Plan de Seguridad está funcionando correctamente. 

**¿Problemas?** Consulta [PRUEBA_PLAN_SEGURIDAD.md](./PRUEBA_PLAN_SEGURIDAD.md) para troubleshooting detallado.

---

**Última actualización:** Octubre 10, 2025

