# Servicio de Cola para ChatGPT

Este servicio gestiona las solicitudes a ChatGPT a través de Azure Queue Storage para evitar alcanzar los límites de RPM (Requests Per Minute).

## Instalación

```bash
# Instalar dependencias
npm install

# Crear archivo .env con la configuración
cp .env.example .env
# (Editar .env con tus credenciales)
```

## Variables de Entorno

Crea un archivo `.env` con el siguiente contenido:

```
# Configuración para Azure Storage Queue
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=chatgptqueue;AccountKey=YOUR-KEY-HERE;EndpointSuffix=core.windows.net

# Configuración para Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_KEY=YOUR-OPENAI-KEY-HERE
AZURE_OPENAI_DEPLOYMENT=gpt-35-turbo

# Límites de uso
MAX_REQUESTS_PER_MINUTE=95
```

## Probar Conexión

```bash
# Verificar conexión con Azure Queue Storage
npm run test
```

## Enviar Mensaje de Prueba

```bash
# Enviar un mensaje de prueba a la cola
node test-send-message.js
```

## Iniciar el Procesador

```bash
# Iniciar el procesador de la cola
npm start

# Para desarrollo (reinicio automático al cambiar archivos)
npm run dev
```

## Cómo Funciona

1. El frontend envía solicitudes a la cola de Azure en lugar de directamente a la API
2. El procesador de colas (QueueProcessor.js) recupera mensajes a un ritmo controlado
3. Se aplica rate limiting para respetar los límites de RPM de Azure OpenAI
4. Las respuestas se devuelven al cliente (pendiente implementar mecanismo)

## Arquitectura

```
Frontend (React) -> Azure Queue Storage -> QueueProcessor -> Azure OpenAI
```

## Siguientes Pasos

- Implementar mecanismo para devolver respuestas al cliente (SignalR, base de datos, etc.)
- Añadir monitoreo y métricas
- Configurar alertas para tamaño de cola excesivo 