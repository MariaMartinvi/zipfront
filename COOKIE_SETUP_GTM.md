# Configuración de Cookies con Google Tag Manager

## Resumen de la Implementación

Se ha implementado un sistema completo de gestión de cookies que cumple con GDPR y respeta las preferencias del usuario. El sistema funciona en conjunto con Google Tag Manager (GTM) para controlar cuándo se ejecutan los scripts de tracking.

## Cómo Funciona

### 1. Categorías de Cookies

- **🔒 Cookies Necesarias** (siempre activas)
  - Firebase Authentication
  - Stripe (procesamiento de pagos)
  - Funcionalidad básica de la aplicación

- **📊 Cookies de Análisis** (opcional)
  - Google Analytics (vía GTM)
  - Estadísticas de uso

- **🎯 Cookies de Marketing** (opcional)
  - Google Ads (vía GTM)
  - Remarketing y publicidad personalizada

- **⚙️ Cookies de Funcionalidad** (opcional)
  - Preferencias de idioma
  - Personalización de la interfaz

### 2. Flujo de Funcionamiento

1. **Primera visita**: Se muestra el banner de cookies
2. **Consentimiento**: El usuario elige sus preferencias
3. **GTM se actualiza**: Se envían los permisos al dataLayer
4. **Scripts se ejecutan**: Solo los scripts permitidos se activan

## Configuración Requerida en GTM

### Variables de Consentimiento

En GTM, necesitas crear las siguientes variables personalizadas en **Variables > Variables Definidas por el Usuario**:

```javascript
// Variable: Analytics Consent
Variable Type: Data Layer Variable
Data Layer Variable Name: analytics_storage

// Variable: Marketing Consent  
Variable Type: Data Layer Variable
Data Layer Variable Name: ad_storage

// Variable: Functionality Consent
Variable Type: Data Layer Variable
Data Layer Variable Name: functionality_storage
```

### Triggers de Consentimiento

Crea estos triggers en **Activadores**:

```javascript
// Trigger: Analytics Consent Granted
Trigger Type: Custom Event
Event Name: cookie_consent_update
Fire on: Some Custom Events
Condition: analytics_storage equals granted

// Trigger: Marketing Consent Granted
Trigger Type: Custom Event  
Event Name: cookie_consent_update
Fire on: Some Custom Events
Condition: ad_storage equals granted
```

### Configuración de Tags

#### Google Analytics 4
```javascript
// En la configuración del tag GA4:
1. Ir a "Configuración Avanzada"
2. Seleccionar "Configurar consentimiento"
3. Marcar "Analytics storage" como requerido
4. Asignar el trigger: "Analytics Consent Granted"
```

#### Google Ads
```javascript
// En la configuración del tag Google Ads:
1. Ir a "Configuración Avanzada"
2. Seleccionar "Configurar consentimiento"  
3. Marcar "Ad storage" como requerido
4. Asignar el trigger: "Marketing Consent Granted"
```

## Eventos que se Envían al dataLayer

### Al cargar la página (con consentimiento guardado)
```javascript
{
  'consent': 'default',
  'analytics_storage': 'granted' | 'denied',
  'ad_storage': 'granted' | 'denied', 
  'functionality_storage': 'granted' | 'denied'
}
```

### Al actualizar preferencias
```javascript
{
  'consent': 'update',
  'analytics_storage': 'granted' | 'denied',
  'ad_storage': 'granted' | 'denied',
  'functionality_storage': 'granted' | 'denied'
}
```

### Evento personalizado de tracking
```javascript
{
  'event': 'cookie_consent_update',
  'analytics_consent': 'granted' | 'denied',
  'marketing_consent': 'granted' | 'denied', 
  'functionality_consent': 'granted' | 'denied',
  'timestamp': '2024-01-15T10:30:00.000Z'
}
```

## Archivos Modificados

- `src/CookieBanner.js` - Componente principal del banner
- `src/CookieBanner.css` - Estilos del banner (discreto y moderno)
- `src/services/cookieService.js` - Servicio de gestión de cookies
- `public/index.html` - Script de inicialización de GTM con consentimiento
- `src/App.js` - Integración del banner en la aplicación

## Funcionalidades Implementadas

✅ Banner discreto que aparece solo en la primera visita
✅ Tres opciones: "Aceptar todas", "Solo necesarias", "Personalizar"
✅ Panel de preferencias detallado con toggles para cada categoría
✅ Integración completa con GTM Consent API v2
✅ Almacenamiento de preferencias en localStorage
✅ Renovación automática del consentimiento cada 12 meses (GDPR)
✅ Scripts se cargan solo si hay consentimiento
✅ Diseño responsive y accesible

## Testing

Para probar el sistema:

1. Abre la aplicación en modo incógnito
2. Verifica que aparece el banner
3. Revisa la consola para ver los eventos de GTM
4. Comprueba que los scripts se activan/desactivan según las preferencias
5. Verifica que las preferencias se mantienen tras recargar

## Cumplimiento GDPR

- ✅ Consentimiento explícito requerido
- ✅ Opciones granulares por categoría
- ✅ Fácil revocación de consentimiento
- ✅ Información clara sobre cada tipo de cookie
- ✅ Almacenamiento de fecha de consentimiento
- ✅ Renovación automática anual 