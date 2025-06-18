# Configuración de Evento de Signup en Google Ads con GTM

## Resumen

Este documento explica cómo configurar el seguimiento de eventos de registro (signup) en Google Ads usando Google Tag Manager para tu aplicación con Firebase Auth.

## 📊 Eventos que se Envían

### Evento Principal: `signup_completed`
```javascript
{
  'event': 'signup_completed',
  'user_id': 'firebase_user_id',
  'email': 'user@example.com',
  'method': 'email' | 'google',
  'timestamp': '2024-01-15T10:30:00.000Z',
  'conversion_id': 'firebase_user_id',
  'conversion_label': 'signup' | 'signup_google',
  'conversion_value': 1
}
```

### Evento de Respaldo: `sign_up` (GTM Native)
```javascript
gtag('event', 'sign_up', {
  'method': 'email' | 'google',
  'user_id': 'firebase_user_id',
  'custom_parameter_1': 'firebase_auth' | 'google_auth'
});
```

## 🎯 Configuración en Google Ads

### 1. Crear Conversión en Google Ads

1. Ve a **Google Ads Console** → **Herramientas y configuración** → **Conversiones**
2. Haz clic en **+ Nueva conversión**
3. Selecciona **Sitio web**
4. Completa los campos:
   - **Nombre de conversión**: "Registro de usuario"
   - **Categoría**: "Registro"
   - **Valor**: "Usar el mismo valor para cada conversión" → 1
   - **Recuento**: "Una"
   - **Ventana de conversión**: 30 días
   - **Ventana de conversión tras visualización**: 1 día
   - **Atribución**: "Basada en datos"

5. Obtendrás un **ID de conversión** (AW-XXXXXXXXX) y una **Etiqueta de conversión**

### 2. Anotar tus IDs de Conversión

```javascript
// REEMPLAZA ESTOS VALORES EN EL CÓDIGO
Conversion ID: AW-XXXXXXXXX
Conversion Label: YYYYYYYYY
```

## 🏷️ Configuración en Google Tag Manager

### 1. Variables Personalizadas

Ve a **Variables** → **Variables definidas por el usuario** → **Nueva**:

#### Variable: Signup User ID
- **Tipo**: Variable de capa de datos
- **Nombre**: `signup_user_id`
- **Nombre de variable de capa de datos**: `user_id`

#### Variable: Signup Method
- **Tipo**: Variable de capa de datos
- **Nombre**: `signup_method`
- **Nombre de variable de capa de datos**: `method`

#### Variable: Conversion Value
- **Tipo**: Variable de capa de datos
- **Nombre**: `conversion_value`
- **Nombre de variable de capa de datos**: `conversion_value`

### 2. Activadores (Triggers)

#### Trigger: Signup Completed
- **Nombre**: "Signup Completed"
- **Tipo**: Evento personalizado
- **Nombre del evento**: `signup_completed`
- **Usar regex**: No

### 3. Etiquetas (Tags)

#### Etiqueta Principal: Google Ads Conversion
- **Nombre**: "Google Ads - Signup Conversion"
- **Tipo**: Google Ads Conversion Tracking
- **Conversion ID**: `AW-XXXXXXXXX` (tu ID real)
- **Conversion Label**: `YYYYYYYYY` (tu etiqueta real)
- **Conversion Value**: `{{conversion_value}}`
- **Order ID**: `{{signup_user_id}}`
- **Activador**: "Signup Completed"

#### Etiqueta de Respaldo: Google Analytics 4
- **Nombre**: "GA4 - Sign Up Event"
- **Tipo**: Google Analytics: GA4 Event
- **Event Name**: `sign_up`
- **Parámetros del evento**:
  - `method`: `{{signup_method}}`
  - `user_id`: `{{signup_user_id}}`
- **Activador**: "Signup Completed"

## 🔧 Actualizar Código con tus IDs

### En `firebase_auth.js`, reemplaza:

```javascript
// Línea 362 y 1001 - Reemplazar con tus IDs reales
'send_to': 'AW-XXXXXXXXX/YYYYYYYYY'

// Por ejemplo:
'send_to': 'AW-123456789/AbCdEfGhIj'
```

## 🧪 Testing y Verificación

### 1. Modo de Vista Previa de GTM
1. En GTM, haz clic en **Vista previa**
2. Ingresa la URL de tu sitio
3. Realiza un registro de prueba
4. Verifica que aparezca el evento `signup_completed` en el debugger

### 2. Herramientas de Desarrollo del Navegador
```javascript
// En la consola del navegador, después de un registro:
console.log(window.dataLayer);
// Debe mostrar el evento signup_completed

// Verificar gtag
window.gtag('config', 'GA_MEASUREMENT_ID', {'debug_mode': true});
```

### 3. Google Ads Conversion Tracking
1. En Google Ads → **Herramientas** → **Conversiones**
2. Busca tu conversión "Registro de usuario"
3. Puede tomar hasta 24 horas en aparecer

## 🚀 Eventos que se Rastrean

✅ **Registro con email** (`method: 'email'`)
✅ **Registro con Google** (`method: 'google'`)  
✅ **User ID único** para evitar duplicados
✅ **Timestamp** para análisis temporal
✅ **Conversion value** configurable

## 📋 Checklist de Implementación

- [ ] Configurar conversión en Google Ads
- [ ] Anotar Conversion ID y Label
- [ ] Crear variables en GTM
- [ ] Crear activador en GTM
- [ ] Crear etiquetas en GTM  
- [ ] Actualizar IDs en el código
- [ ] Probar en modo vista previa
- [ ] Verificar eventos en consola
- [ ] Confirmar conversiones en Google Ads (24h)

## 🔍 Troubleshooting

### Problema: No aparecen eventos en GTM
**Solución**: Verificar que `window.dataLayer` existe y que el evento se está enviando:
```javascript
console.log('DataLayer:', window.dataLayer);
```

### Problema: No aparecen conversiones en Google Ads
**Solución**: 
1. Verificar que los IDs de conversión son correctos
2. Esperar 24-48 horas para que aparezcan
3. Verificar en "Columnas" → "Conversiones" en Google Ads

### Problema: GTM no detecta el sitio
**Solución**: Verificar que el código de GTM está en `public/index.html`:
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
```

¿Necesitas ayuda con algún paso específico? 🤔 