# ⚡ QUICK START - Sistema de Alertas de Pánico

## ✅ ¿Qué se implementó?

### 1️⃣ Duración Configurable (1-60 min)
- Control deslizante en configuración
- Auto-desactivación al expirar

### 2️⃣ Persistencia de Alertas
- Se vuelven a mostrar cada 15 segundos
- Hasta que el receptor confirme o expire

### 3️⃣ Exclusión del Emisor
- El que activa la alerta NO la ve

---

## 🚀 Cómo Usar

### Configurar (Una vez)
```
1. Ir a /residentes/panico
2. Pestaña "Configuración"
3. Ajustar duración (ej: 10 minutos)
4. Seleccionar contactos
5. Guardar
```

### Activar Emergencia
```
1. Presionar botón de pánico
2. ✅ Aparece: "¡Alerta enviada! Durará 10 min"
3. ❌ NO aparece modal (eres el emisor)
4. Ver historial para seguimiento
```

### Recibir Alerta (Receptor)
```
1. Modal aparece con sonido
2. Ver tiempo restante: "⏳ 8:45 min"
3. Opciones:
   - Presionar "HE SIDO NOTIFICADO" → No vuelve a aparecer
   - Cerrar con X → Reaparece en 15 seg
```

---

## 🎯 Flujo en 30 Segundos

```
EMISOR                    SISTEMA                    RECEPTOR
  │                         │                           │
  │─ Activa pánico ────────>│                           │
  │   (10 min)              │                           │
  │                         │                           │
  │<─ "¡Enviado!" ──────────│                           │
  │   (Toast)               │                           │
  │                         │                           │
  │ ❌ NO ve modal          │─── Envía alerta ─────────>│
  │                         │                           │
  │                         │                      ┌────┴────┐
  │                         │                      │ Modal   │
  │                         │                      │ aparece │
  │                         │                      └────┬────┘
  │                         │                           │
  │                         │                      ¿Confirma?
  │                         │                      │    │
  │                         │                   SÍ │    │ NO
  │                         │                      │    │
  │                         │<─ Confirmación ──────┘    │
  │                         │                           │
  │<─ "2 de 5 confirmaron" ─│                      15s  │
  │   (Historial)           │                           │
  │                         │                           ▼
  │                         │                    Reaparece
  │                         │                      modal
  │                         │                           │
  │                         │                      (Repite)
```

---

## 💡 Reglas de Oro

1. **Emisor**: NO ve modal, solo toast y historial
2. **Receptor**: Ve modal hasta confirmar o expirar
3. **Persistencia**: Cada 15 segundos si no confirma
4. **Expiración**: Auto-desactivación al cumplir tiempo
5. **Confirmación**: Solo receptores pueden confirmar

---

## 🎨 Visuales Clave

### Configuración
```
Duración de la Señal de Alerta
┌─────────────○─────┐  10 min
```

### Modal (Receptor)
```
🚨 ¡EMERGENCIA!
Juan Pérez NECESITA AYUDA
⏳ 9:30 min restantes
[LLAMAR 911] [HE SIDO NOTIFICADO]
```

### Historial (Emisor)
```
Alerta - 14:00
⏱️ Duración: 10 min | Expira: 14:10
✅ 3 de 5 confirmaron
Estado: Activo 🔴
```

---

## ⚠️ Importante

- ⏱️ Duración: Entre 1 y 60 minutos
- 🔄 Reaparición: Cada 15 segundos
- ❌ Emisor: NO ve modal
- ✅ Receptores: VEN modal persistente

---

## 🏁 ¡Listo!

El sistema está **completamente funcional**.

**Compilación**: ✅ Sin errores  
**Estado**: Lista para usar  
**Versión**: 2.0.0

