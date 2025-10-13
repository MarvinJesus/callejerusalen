# 🚀 Guía de Despliegue - Sistema de Notificaciones de Pánico

## 📋 Pre-requisitos

Antes de desplegar, verifica que tienes:

- [x] Firebase configurado
- [x] Firestore activado
- [x] Reglas de Firestore actualizadas
- [x] Variables de entorno configuradas
- [x] Plan de Seguridad activo con usuarios inscritos

---

## 🔧 Pasos para Desplegar

### 1. Verificar Archivos

Asegúrate de que todos los archivos estén presentes:

```bash
# Verificar archivos nuevos
ls -la lib/alarmSound.ts
ls -la hooks/usePanicNotifications.ts
ls -la components/PanicNotificationSystem.tsx

# Verificar archivos modificados
git status
```

**Archivos esperados:**
```
modified:   app/layout.tsx
modified:   firestore.rules
new file:   lib/alarmSound.ts
new file:   hooks/usePanicNotifications.ts
new file:   components/PanicNotificationSystem.tsx
new file:   SISTEMA_NOTIFICACIONES_PANICO.md
new file:   PRUEBA_NOTIFICACIONES_PANICO.md
new file:   RESUMEN_NOTIFICACIONES_PANICO.md
new file:   DEPLOY_NOTIFICACIONES_PANICO.md
```

---

### 2. Actualizar Reglas de Firestore

**IMPORTANTE**: Las reglas de Firestore deben actualizarse ANTES de desplegar.

```bash
# Desde la raíz del proyecto
firebase deploy --only firestore:rules
```

**Verificar en Firebase Console:**
1. Ir a: https://console.firebase.google.com
2. Seleccionar proyecto
3. Firestore Database → Rules
4. Verificar que la regla de `panicReports` incluya:
   ```javascript
   request.auth.uid in resource.data.notifiedUsers
   ```

---

### 3. Instalar Dependencias (si es necesario)

```bash
npm install
# o
yarn install
```

**Nota**: No se requieren dependencias adicionales. El sistema usa solo las bibliotecas ya instaladas.

---

### 4. Compilar el Proyecto

```bash
# Compilar TypeScript
npm run build

# Verificar que no hay errores
echo $?  # Debe ser 0
```

**Verificar salida:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
```

---

### 5. Probar Localmente

```bash
# Ejecutar en modo desarrollo
npm run dev

# Abrir navegador
# http://localhost:3000
```

**Prueba rápida:**
1. Ir a `/residentes/panico`
2. Configurar contactos
3. Activar pánico
4. Verificar que el sistema funcione

---

### 6. Desplegar a Producción

#### Opción A: Vercel (Recomendado)

```bash
# Si usas Vercel CLI
vercel --prod

# O push a la rama main
git add .
git commit -m "feat: Sistema de notificaciones de pánico con sonido y notificaciones del navegador"
git push origin main
```

**Vercel desplegará automáticamente.**

#### Opción B: Firebase Hosting

```bash
# Deploy completo
firebase deploy

# O solo hosting
firebase deploy --only hosting
```

#### Opción C: Otro servicio

Sigue las instrucciones de tu servicio de hosting.

---

### 7. Verificar Despliegue

Una vez desplegado, verifica:

1. **Acceder a la aplicación**
   ```
   https://tu-dominio.com
   ```

2. **Verificar que los archivos se carguen**
   - Abrir DevTools (F12)
   - Network tab
   - Buscar: `alarmSound.ts`, `PanicNotificationSystem.tsx`
   - ✅ Deben cargarse sin errores 404

3. **Verificar Firestore**
   - Firebase Console → Firestore
   - Verificar que las reglas estén actualizadas
   - Timestamp de última actualización debe ser reciente

4. **Probar funcionalidad**
   - Seguir `PRUEBA_NOTIFICACIONES_PANICO.md`
   - Verificar sonido, notificaciones y modal

---

## 🔒 Configuración de Seguridad

### Reglas de Firestore Críticas

**Antes del despliegue, verificar:**

```javascript
// firestore.rules - panicReports
match /panicReports/{reportId} {
  allow create: if hasSecurityAccess();
  allow read: if request.auth != null && 
    (isAdminOrSuperAdmin() || 
     hasSecurityAccess() ||
     request.auth.uid in resource.data.notifiedUsers);  // ← CRÍTICO
  allow update: if request.auth != null && 
    (isAdminOrSuperAdmin() || request.auth.uid == resource.data.userId);
  allow delete: if isAdminOrSuperAdmin();
}
```

**Si esta regla no está actualizada, las notificaciones NO funcionarán.**

---

## 📱 Configuración de Notificaciones del Navegador

### HTTPS Requerido

Las notificaciones del navegador **requieren HTTPS** en producción.

**Verificar:**
```
https://tu-dominio.com  ✅ Funciona
http://tu-dominio.com   ❌ No funciona (excepto localhost)
```

### Configuración de Firebase

Si usas Firebase Cloud Messaging (opcional):

1. Firebase Console → Project Settings
2. Cloud Messaging
3. Web Push certificates → Generate key pair
4. Copiar y usar en la app

**Nota**: El sistema actual usa notificaciones del navegador nativas, no requiere FCM.

---

## 🧪 Checklist Post-Despliegue

### Verificación Inmediata

- [ ] Aplicación accesible en producción
- [ ] Sin errores 404 en archivos nuevos
- [ ] Firestore rules actualizadas
- [ ] Usuarios pueden iniciar sesión
- [ ] Página de pánico carga correctamente

### Prueba Funcional (2 usuarios)

- [ ] Usuario A puede configurar contactos
- [ ] Usuario A puede activar pánico
- [ ] Usuario B recibe sonido de alarma
- [ ] Usuario B recibe notificación del navegador
- [ ] Usuario B ve modal visual
- [ ] Usuario B puede marcar como leída
- [ ] Botón flotante funciona correctamente

### Verificación de Seguridad

- [ ] Solo usuarios notificados pueden ver reportes
- [ ] No hay errores en consola
- [ ] Permisos de Firestore correctos
- [ ] HTTPS habilitado

---

## 🐛 Troubleshooting Post-Despliegue

### Error: "Permission denied" en Firestore

**Causa**: Reglas no actualizadas.

**Solución**:
```bash
firebase deploy --only firestore:rules
```

### Error: Archivos no encontrados (404)

**Causa**: Build incompleto.

**Solución**:
```bash
rm -rf .next
npm run build
vercel --prod
```

### Error: Notificaciones no aparecen

**Causa**: No es HTTPS o permisos denegados.

**Solución**:
1. Verificar que sea HTTPS
2. Limpiar permisos del navegador
3. Volver a solicitar permisos

### Error: Sonido no se reproduce

**Causa**: AudioContext suspendido.

**Solución**: Ya está manejado en el código. Si persiste:
```typescript
// En lib/alarmSound.ts
if (this.audioContext.state === 'suspended') {
  this.audioContext.resume();
}
```

---

## 📊 Monitoreo Post-Despliegue

### Métricas a Monitorear

1. **Firebase Console**
   - Firestore → Writes/Reads
   - Authentication → Active users
   - Performance → Loading times

2. **Vercel Dashboard** (si aplica)
   - Build logs
   - Runtime logs
   - Analytics

3. **Browser Console**
   - Errores JavaScript
   - Network requests
   - Performance

### Logs Importantes

Buscar en consola:
```
✅ Firebase inicializado correctamente
✅ PanicoPage - Acceso concedido
👂 Iniciando listener de notificaciones de pánico
📨 Cambios detectados en panicReports
🚨 Nueva alerta de pánico detectada
🔊 Reproduciendo sonido de alarma
📢 Notificación del navegador mostrada
```

---

## 🔄 Rollback (si es necesario)

Si algo sale mal, puedes hacer rollback:

### Opción 1: Git Revert

```bash
# Ver commits recientes
git log --oneline

# Revertir al commit anterior
git revert HEAD
git push origin main
```

### Opción 2: Vercel Rollback

1. Ir a Vercel Dashboard
2. Deployments
3. Seleccionar deployment anterior
4. Click en "Promote to Production"

### Opción 3: Restaurar Reglas de Firestore

1. Firebase Console
2. Firestore → Rules
3. History
4. Seleccionar versión anterior
5. Publish

---

## 📝 Notas Importantes

### 1. Compatibilidad de Navegadores

El sistema funciona en:
- ✅ Chrome/Edge (Windows, Mac, Android)
- ✅ Firefox (Windows, Mac, Android)
- ✅ Safari (Mac) - Notificaciones limitadas
- ⚠️ Safari (iOS) - Requiere PWA

### 2. Rendimiento

- **Firestore Reads**: ~1 read por usuario notificado por alerta
- **Audio**: Generado dinámicamente, no usa ancho de banda
- **Notificaciones**: Nativas del navegador, no cuestan recursos

### 3. Costos Estimados

Para 100 alertas/mes con 5 usuarios notificados cada una:
- Firestore: 500 reads + 100 writes ≈ $0.00 (dentro del free tier)
- Hosting: Incluido en Vercel free tier
- Notificaciones: Gratis (nativas)

---

## 🎯 Siguiente Paso

Después del despliegue exitoso:

1. **Comunicar a usuarios**
   - Enviar guía de uso
   - Explicar sistema de notificaciones
   - Solicitar permisos de navegador

2. **Capacitación**
   - Sesión de prueba con usuarios
   - Demostración en vivo
   - Q&A

3. **Monitoreo**
   - Primera semana: revisar diariamente
   - Recolectar feedback
   - Ajustar según necesidades

---

## ✅ Checklist Final

Antes de considerar el despliegue completo:

- [ ] Código compilado sin errores
- [ ] Tests funcionales completados
- [ ] Reglas de Firestore desplegadas
- [ ] Aplicación desplegada en producción
- [ ] HTTPS verificado
- [ ] Prueba end-to-end exitosa
- [ ] Documentación compartida con equipo
- [ ] Plan de rollback listo
- [ ] Monitoreo configurado
- [ ] Usuarios notificados

---

## 📞 Soporte Post-Despliegue

Si encuentras problemas:

1. **Revisar logs** en Firebase Console y Vercel
2. **Consultar documentación**:
   - `SISTEMA_NOTIFICACIONES_PANICO.md`
   - `PRUEBA_NOTIFICACIONES_PANICO.md`
3. **Verificar issues conocidos** en este documento
4. **Contactar soporte técnico**

---

## 🎉 ¡Despliegue Exitoso!

Una vez completados todos los pasos, el sistema estará:

✅ Desplegado en producción  
✅ Accesible para todos los usuarios  
✅ Monitoreado y funcionando  
✅ Listo para salvar vidas  

---

**Fecha de despliegue**: _____________  
**Desplegado por**: _____________  
**Versión**: 1.0.0  
**Estado**: ⚠️ Pendiente → ✅ Completado

---

## 📚 Referencias

- [Documentación Técnica](./SISTEMA_NOTIFICACIONES_PANICO.md)
- [Guía de Prueba](./PRUEBA_NOTIFICACIONES_PANICO.md)
- [Resumen Ejecutivo](./RESUMEN_NOTIFICACIONES_PANICO.md)
- [Firebase Console](https://console.firebase.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

**¡El sistema está listo para producción! 🚀**


