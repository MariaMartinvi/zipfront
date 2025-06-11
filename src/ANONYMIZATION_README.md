# Servicio de Anonimización Multiidioma

## Descripción

Servicio avanzado de anonimización de texto que soporta múltiples idiomas usando **Compromise**, **spaCy** y patrones específicos por idioma.

## Idiomas Soportados

### Con spaCy (Procesamiento Avanzado)
- ✅ **Español** - `es_core_news_sm`
- ✅ **Inglés** - `en_core_web_sm`
- ✅ **Alemán** - `de_core_news_sm`
- ✅ **Francés** - `fr_core_news_sm`
- ✅ **Italiano** - `it_core_news_sm`

### Con Patrones Específicos
- ✅ **Catalán** - Patrones de nombres y lugares catalanes
- ✅ **Euskera** - Patrones de nombres y lugares vascos

## Instalación

### 1. Instalar dependencias de Node.js
```bash
npm install franc spacy-nlp compromise-dates compromise-numbers
```

### 2. Instalar modelos de spaCy
```bash
node install-spacy-models.js
```

Este script automáticamente:
- Verifica si Python está instalado
- Instala spaCy si no está presente
- Descarga e instala todos los modelos de idiomas
- Crea un archivo de configuración `spacy-config.json`

## Uso Básico

```javascript
import { anonymizationService } from './services/anonymizationService.js';

// Procesar contenido para Azure (detección automática de idioma)
const chatContent = `[12/03/23, 14:30:15] María García: Hola Juan, 
¿te veo mañana en la Calle Mayor 123?`;

const anonymizedContent = await anonymizationService.processContentForAzure(chatContent);
console.log(anonymizedContent);
// Output: [12/03/23, 14:30:15] Participante 1: Hola [PERSONA 1], 
// ¿te veo mañana en [LUGAR 1]?
```

## Funcionalidades Principales

### 1. Detección Automática de Idioma
- Usa la librería `franc` para detectar el idioma del contenido
- Fallback inteligente si no se puede detectar

### 2. Anonimización de Participantes
- Identifica participantes del chat automáticamente
- Maneja formatos iOS y Android
- Mapeo consistente: el mismo participante siempre recibe el mismo ID

### 3. Anonimización de Personas Mencionadas
- **spaCy**: Para idiomas con modelos disponibles (español, inglés, alemán, francés, italiano)
- **Compromise**: Para inglés y español como refuerzo
- **Patrones**: Para catalán y euskera

### 4. Anonimización de Lugares
- Detección de direcciones y ciudades
- Patrones específicos por idioma
- Preserva la estructura del texto

### 5. Limpieza Específica por Idioma
- DNI/IDs según formato del país
- Números de teléfono por región
- Códigos postales

## API del Servicio

### Métodos Principales

#### `processContentForAzure(content)`
```javascript
const result = await anonymizationService.processContentForAzure(chatContent);
```
Procesamiento completo con detección automática de idioma.

#### `detectLanguage(content)`
```javascript
const language = anonymizationService.detectLanguage(content);
console.log(language); // 'spa', 'eng', 'deu', etc.
```

#### `anonymizeMentionedPeople(content, language)`
```javascript
const result = await anonymizationService.anonymizeMentionedPeople(content, 'spa');
```

### Métodos de Configuración

#### `setDefaultLanguage(languageCode)`
```javascript
anonymizationService.setDefaultLanguage('deu'); // Alemán por defecto
```

#### `getSupportedLanguages()`
```javascript
const languages = anonymizationService.getSupportedLanguages();
console.log(languages);
// {
//   spa: { name: 'Spanish', spacyAvailable: true, compromiseSupport: true },
//   eng: { name: 'English', spacyAvailable: true, compromiseSupport: true },
//   ...
// }
```

#### `getProcessingStats()`
```javascript
const stats = anonymizationService.getProcessingStats();
console.log(stats);
// {
//   currentLanguage: 'spa',
//   participantsProcessed: 3,
//   mentionedPeopleProcessed: 5,
//   locationsProcessed: 2,
//   ...
// }
```

### Métodos de Debugging

#### `getAllMappings()`
```javascript
const mappings = anonymizationService.getAllMappings();
console.log(mappings);
// {
//   participants: { "María García": "Participante 1" },
//   mentionedPeople: { "Juan": "[PERSONA 1]" },
//   locations: { "Calle Mayor 123": "[LUGAR 1]" }
// }
```

#### `reset()`
```javascript
anonymizationService.reset(); // Reinicia todos los contadores y mapeos
```

## Patrones de Anonimización

### Por Tipo de Entidad
- **Participantes**: `Participante 1`, `Participante 2`, etc.
- **Personas**: `[PERSONA 1]`, `[PERSONA 2]`, etc.
- **Lugares**: `[LUGAR 1]`, `[LUGAR 2]`, etc.
- **Organizaciones**: `[ORGANIZACIÓN]`
- **Profesionales**: `[PROFESIONAL]`
- **Familiares**: `[FAMILIAR]`
- **Académicos**: `[ACADÉMICO]`

### Por Datos Sensibles
- **DNI/IDs**: `[ID_DOCUMENTO]`
- **Teléfonos**: `[TELÉFONO]`
- **Códigos Postales**: `[CÓDIGO_POSTAL]`
- **Fechas Complejas**: `[FECHA]`

## Ejemplo de Flujo Completo

```javascript
// 1. Configurar idioma por defecto (opcional)
anonymizationService.setDefaultLanguage('spa');

// 2. Procesar contenido
const chatContent = `
[12/03/23, 14:30:15] Dr. García: Hola María, 
te veo en Calle Aragón 123, Barcelona.
[12/03/23, 14:31:02] María López: Perfecto, 
¿traigo a mi hermano Juan?
`;

const result = await anonymizationService.processContentForAzure(chatContent);

// 3. Ver estadísticas
console.log(anonymizationService.getProcessingStats());

// 4. Ver mapeos para debugging
console.log(anonymizationService.getAllMappings());
```

## Configuración Avanzada

### Añadir Nuevos Patrones por Idioma

Para añadir patrones específicos, modifica los objetos `namePatterns` y `locationPatterns` en las funciones `anonymizeWithPatterns` y `applyLanguageSpecificCleanup`.

### Verificar Modelos spaCy

```javascript
// Verificar si spaCy está disponible para un idioma
const isAvailable = anonymizationService.isSpacyAvailable('deu');
console.log(`spaCy alemán disponible: ${isAvailable}`);
```

## Solución de Problemas

### Error: Modelo spaCy no encontrado
1. Ejecuta: `node install-spacy-models.js`
2. Verifica que Python esté instalado
3. El servicio automáticamente usa patrones como fallback

### Error: Idioma no detectado correctamente
1. Asegúrate de que el contenido tenga suficiente texto (>10 caracteres)
2. Configura manualmente el idioma: `setDefaultLanguage('spa')`

### Error: Faltan dependencias
```bash
npm install franc spacy-nlp compromise-dates compromise-numbers
```

## Rendimiento

- **spaCy**: Mejor precisión, algo más lento
- **Compromise**: Rápido, bueno para inglés/español
- **Patrones**: Muy rápido, básico pero efectivo
- **Detección de idioma**: ~10ms para textos cortos

El servicio optimiza automáticamente usando la mejor opción disponible para cada idioma. 