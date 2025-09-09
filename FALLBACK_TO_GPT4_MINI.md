# 🔄 Sistema de Fallback a GPT-4 Mini

## 📋 **Resumen**

El sistema implementa un fallback automático a **GPT-4 mini** cuando Azure OpenAI falla específicamente por **content filtering errors**. Esta solución mantiene el servicio funcionando sin interrupciones para los usuarios.

---

## 🔧 **Cómo funciona**

### **Flujo Normal:**
```
Azure OpenAI (endpoint principal) → ✅ Respuesta exitosa
```

### **Flujo con Fallback:**
```
Azure OpenAI (endpoint principal) → ❌ Content Filter Error
↓
GPT-4 mini (OpenAI API) + Contenido Sanitizado → ✅ Respuesta exitosa
```

---

## 🛠️ **Configuración requerida**

### **Variables de entorno necesarias:**

```bash
# Variable existente (ya configurada)
REACT_APP_AZURE_ENDPOINT=https://your-azure-endpoint.openai.azure.com/
REACT_APP_AZURE_API_KEY=your-azure-api-key

# Nueva variable para fallback
REACT_APP_OPENAI_API_KEY=your-openai-api-key
```

### **Para desarrollo local (.env):**
```bash
# Azure OpenAI (existente)
REACT_APP_AZURE_ENDPOINT=https://your-azure-endpoint.openai.azure.com/
REACT_APP_AZURE_API_KEY=sk-azure-key-here

# OpenAI para fallback (nuevo)
REACT_APP_OPENAI_API_KEY=sk-openai-key-here
```

### **Para producción (Render/Netlify/Vercel):**
Agregar la variable de entorno `REACT_APP_OPENAI_API_KEY` en el panel de configuración.

---

## 🧹 **Sistema de Sanitización**

### **Palabrotas por idioma (consistente con Analisis_top.js):**
- **Español (es):** joder, mierda, cabrón, coño, puta, etc.
- **Inglés (en):** fuck, shit, damn, bitch, asshole, etc.
- **Francés (fr):** merde, putain, bordel, con, etc.
- **Alemán (de):** scheiße, ficken, arsch, etc.
- **Italiano (it):** merda, cazzo, stronzo, etc.
- **Portugués (pt):** merda, caralho, puta, etc.
- **Catalán (ca):** merda, puta, hostia, etc.
- **Euskera (eu):** kaka, puta, zakil, etc.

### **Proceso de sanitización:**
1. **Reemplaza palabrotas** → `[xxx]` o `[contenido filtrado]`
2. **Reduce mayúsculas** → `TEXTO` → `Texto`
3. **Limita signos** → `!!!` → `!!`
4. **Trunca contenido** → máximo 15,000 caracteres

---

## 📊 **Monitoreo y estadísticas**

### **Métricas disponibles:**
```javascript
ContentFilterHandler.stats.getFilterRate()    // % de requests filtrados
ContentFilterHandler.stats.getFallbackRate()  // % de uso de fallback
ContentFilterHandler.stats.getSuccessRate()   // % de éxito en reintentos
```

### **Logs en consola:**
```
🔄 Intento 1: Prompt original + contenido sanitizado
❌ Intento 1 falló: Content filtering error
🚨 Content filtering detectado, activando fallback a GPT-4 mini
📝 Contenido sanitizado para idioma: es
✅ Fallback a GPT-4 mini exitoso
```

---

## 🔬 **Detalles técnicos**

### **Detección de errores de content filtering:**
```javascript
static isContentFilterError(error) {
  const errorText = error.message.toLowerCase();
  return errorText.includes('content management policy') ||
         errorText.includes('filtered') ||
         errorText.includes('content filter') ||
         (error.status === 400 && errorText.includes('request'));
}
```

### **Configuración de GPT-4 mini:**
```javascript
{
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 4000,
  messages: [
    { role: 'system', content: prompt },      // Prompt original sin cambios
    { role: 'user', content: sanitizedContent } // Contenido sanitizado
  ]
}
```

---

## 🚀 **Ventajas del sistema**

1. **🛡️ Transparente para el usuario** - No nota la diferencia
2. **⚡ Automático** - Se activa solo cuando es necesario
3. **🎯 Específico** - Solo para errores de content filtering
4. **🌍 Multiidioma** - Sanitización específica por idioma
5. **📈 Monitoreado** - Estadísticas completas del uso
6. **💸 Económico** - GPT-4 mini es más barato que Azure

---

## 🔧 **Personalización**

### **Agregar nuevas palabrotas:**
Editar `PALABRAS_MALSONANTES` en `ContentFilterHandler.js`:

```javascript
const PALABRAS_MALSONANTES = {
  es: [
    'nueva_palabrota',
    // ... resto de palabras
  ]
};
```

### **Cambiar modelo de fallback:**
Modificar en `fallbackToGPT4Mini()`:

```javascript
model: 'gpt-4',  // En lugar de 'gpt-4o-mini'
```

---

## 🧪 **Testing**

### **Simular content filtering:**
1. Usar palabras muy agresivas en el chat
2. Observar los logs en consola del browser
3. Verificar que se activa el fallback

### **Verificar funcionamiento:**
```javascript
// En DevTools
ContentFilterHandler.stats.totalRequests
ContentFilterHandler.stats.fallbackUsed
```

---

## 📝 **Notas importantes**

- ✅ **El prompt NO se modifica** - Se usa exactamente igual
- ✅ **Solo el contenido se sanitiza** - Mantiene la funcionalidad
- ✅ **Fallback solo por content filtering** - Otros errores siguen el flujo normal
- ✅ **Compatible con todos los idiomas** - es, en, fr, de, it, pt, ca, eu 