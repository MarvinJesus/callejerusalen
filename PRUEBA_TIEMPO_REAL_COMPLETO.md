# ✅ Prueba Rápida: Sistema Tiempo Real Completo

## 🎯 Objetivo

Verificar que TODA la página de alerta activa funciona en tiempo real.

## ⏱️ Tiempo: 5 minutos

## 🧪 Preparación

### Necesitas:
- 2 navegadores/dispositivos (Usuario A y Usuario B)
- 2 usuarios inscritos en el Plan de Seguridad
- Usuario B debe estar en los contactos de Usuario A

### Configuración:
```
Usuario A (Emisor)    Usuario B (Receptor)
Chrome normal    |    Chrome incógnito
                 |
Activa alerta    ←→   Recibe alerta
```

## 📋 Test 1: Presencia de Usuarios (30 segundos)

### Usuario A:
1. Inicia sesión
2. Activa alerta de pánico
3. Espera en la página `/residentes/panico/activa/[id]`

### Usuario B:
1. Inicia sesión (otro navegador)
2. Accede a la misma alerta
3. **Observa**: Deberías aparecer en la lista de Usuario A

### ✅ Verificación en Pantalla de Usuario A:
```
┌─────────────────────────────────────┐
│ 🟢 Viendo ahora (1)                 │
│ ┌──────────────┐                    │
│ │● Usuario B   │                    │
│ └──────────────┘                    │
└─────────────────────────────────────┘
```

**Resultado esperado**:
- ✅ Usuario A ve "Viendo ahora (1)"
- ✅ Nombre de Usuario B aparece
- ✅ Punto verde junto al nombre

---

## 📋 Test 2: Confirmaciones en Tiempo Real (30 segundos)

### Usuario B:
1. Click en "HE SIDO NOTIFICADO"
2. **NO refrescar la página**

### ✅ Verificación en Pantalla de Usuario A:

**Antes**:
```
Confirmaciones: 0 de 2 (0%)
[▱▱▱▱▱▱▱▱▱▱] 0%
```

**Después** (1-2 segundos):
```
Confirmaciones: 1 de 2 (50%)
[█████▱▱▱▱▱] 50%

● Usuario B    [✓ Confirmó]  ← Cambió!
```

**Resultado esperado**:
- ✅ Barra de progreso se llena instantáneamente
- ✅ Contador cambia a 1 de 2
- ✅ Estado de Usuario B: "Pendiente..." → "✓ Confirmó"
- ✅ **SIN refrescar página**

---

## 📋 Test 3: Indicador de "Escribiendo" (20 segundos)

### Usuario B:
1. Ubica el input del chat
2. **Empieza a escribir** (no envíes aún)
3. Escribe lentamente: "Hola, voy en cam..."

### ✅ Verificación en Pantalla de Usuario A:

```
┌─────────────────────────────────────┐
│ ●●● Usuario B está escribiendo...  │ ← Aparece aquí
└─────────────────────────────────────┘
[Escribe un mensaje...         ] [>]
```

**Resultado esperado**:
- ✅ Aparece indicador con puntos animados
- ✅ Nombre de Usuario B
- ✅ Texto "está escribiendo..."
- ✅ Desaparece 3 seg después de dejar de escribir

---

## 📋 Test 4: Mensajes en Tiempo Real (30 segundos)

### Usuario B:
1. Termina de escribir: "Hola, voy en camino"
2. Presiona Enter o click en enviar

### Usuario A:
1. **Observa el chat** (NO refrescar)

### ✅ Verificación en Pantalla de Usuario A:

```
[Chat]
┌─────────────────────────────────────┐
│ Usuario B (Responde)               │
│ Hola, voy en camino                │  ← Aparece en 1-2 seg
│ 10:15:23                           │
└─────────────────────────────────────┘
```

**Resultado esperado**:
- ✅ Mensaje aparece en 1-2 segundos
- ✅ SIN refrescar página
- ✅ Scroll automático al final
- ✅ Estilo correcto (gris para otros usuarios)

---

## 📋 Test 5: Estado de Alerta en Tiempo Real (20 segundos)

### Usuario A (Emisor):
1. Click en "MARCAR COMO RESUELTA"
2. Confirmar acción

### ✅ Verificación en Pantalla de Usuario B:

```
[Toast Notification]
✅ La alerta ha sido resuelta

[Header]
Estado: resolved  ← Cambió de "active"

[Botones]
[LLAMAR AL 911]  [VOLVER]  ← Deshabilitados
```

**Resultado esperado**:
- ✅ Toast aparece inmediatamente
- ✅ Estado cambia a "resolved"
- ✅ Chat se deshabilita
- ✅ **SIN refrescar página**

---

## 📋 Test 6: Multi-Usuario (1 minuto)

Si tienes un tercer dispositivo/usuario:

### Usuario C:
1. Abre la misma alerta

### ✅ Verificación en Pantallas de A y B:

```
┌─────────────────────────────────────┐
│ 🟢 Viendo ahora (2)                 │  ← Cambió a 2!
│ ┌──────────┐ ┌──────────┐          │
│ │● Usuario B│ │● Usuario C│          │
│ └──────────┘ └──────────┘          │
└─────────────────────────────────────┘
```

**Resultado esperado**:
- ✅ Usuario A y B ven que C se unió
- ✅ Contador "Viendo ahora" aumenta
- ✅ Nombre de Usuario C aparece

---

## 📊 Checklist General

Marca cada item que funcione:

### Presencia de Usuarios
- [ ] Aparece "Viendo ahora" cuando hay usuarios
- [ ] Lista se actualiza cuando entran/salen
- [ ] Puntos verdes junto a nombres en línea
- [ ] Estado "Viendo..." vs "Pendiente..."

### Confirmaciones
- [ ] Barra de progreso se actualiza instantáneamente
- [ ] Contador cambia en tiempo real
- [ ] Estado del contacto cambia (Pendiente → Confirmó)
- [ ] Sin necesidad de refrescar

### Chat
- [ ] Mensajes aparecen en 1-2 segundos
- [ ] Indicador "escribiendo" funciona
- [ ] Scroll automático al final
- [ ] Sin mensajes duplicados

### Estado de Alerta
- [ ] Cambios de estado instantáneos
- [ ] Toast notifications apropiados
- [ ] Botones se actualizan según estado
- [ ] Tiempo restante se actualiza cada segundo

### Performance
- [ ] Latencia aceptable (<3 seg)
- [ ] No hay lag en la UI
- [ ] No se necesita refrescar nunca
- [ ] Funciona con múltiples usuarios

## 🔍 Verificación en Consola

Abre DevTools (F12) y verifica estos logs:

```javascript
// Deberías ver:
📡 Iniciando escucha en tiempo real de alerta: abc123
💬 Iniciando escucha en tiempo real del chat (Firestore)...
🟢 Iniciando sistema de presencia para alerta: abc123
💬 Mensajes actualizados en tiempo real. Total: 3
🔄 Alerta actualizada en tiempo real: { ... }
```

**NO deberías ver**:
```javascript
❌ Error al escuchar cambios
❌ Error de permisos
❌ WebSocket connection failed (está OK, usa Firestore)
```

## ⚡ Prueba Rápida (30 segundos)

Si no tienes tiempo, haz esta prueba ultra rápida:

1. **Usuario A**: Activa alerta
2. **Usuario B**: Abre alerta (User A ve que B entró)
3. **Usuario B**: Confirma recepción (A ve confirmación)
4. **Usuario B**: Envía mensaje (A lo ve instantáneamente)
5. **Usuario A**: Resuelve alerta (B recibe notificación)

**Si todo esto funciona SIN refrescar = ✅ ÉXITO**

## 🐛 Problemas Comunes

### "No veo usuarios en línea"
```bash
# Solución:
- Espera 10 segundos (heartbeat)
- Verifica que ambos usuarios estén autenticados
- Revisa reglas de Firestore (alertPresence)
```

### "Confirmaciones no se actualizan"
```bash
# Solución:
- Abre consola y busca errores
- Verifica que veas: "📡 Iniciando escucha en tiempo real"
- Recarga la página una vez
```

### "Indicador de escribiendo no aparece"
```bash
# Solución:
- Escribe más lento (espera 1-2 seg entre letras)
- Verifica que el otro usuario esté en "Viendo ahora"
- Revisa consola de errores
```

## ✅ Resultado Esperado

Si TODOS los tests pasan:

```
✅ Presencia de usuarios
✅ Confirmaciones en tiempo real
✅ Indicador "escribiendo"
✅ Mensajes instantáneos
✅ Estado de alerta actualizado
✅ Multi-usuario funcional
```

**= 🎉 SISTEMA 100% EN TIEMPO REAL**

## 📈 Próximo Paso

Si todo funciona:
```bash
git add .
git commit -m "Sistema tiempo real completo con presencia"
git push origin main
```

**¡Listo para producción!** 🚀

---

**Tiempo total de prueba**: 5 minutos  
**Dificultad**: Fácil  
**Requisitos**: 2 usuarios  
**Resultado**: ✅ Verificación completa del sistema

