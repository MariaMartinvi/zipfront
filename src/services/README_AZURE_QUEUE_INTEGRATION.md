# Integración con Cola de Azure Existente

Este documento explica cómo el frontend se integra con la cola existente en Azure Storage para manejar el límite de solicitudes (error 429) en Azure OpenAI.

## Resumen de la implementación

La aplicación maneja los errores 429 (Too Many Requests) enviando las solicitudes a una cola existente en Azure Storage cuando se alcanzan los límites de solicitudes por minuto (RPM). Estas solicitudes son procesadas posteriormente cuando hay disponibilidad.

## Componentes principales

1. **Chatgptresultados.js**: Componente que detecta los errores 429 y envía solicitudes a la cola
2. **azureQueueService.js**: Servicio que gestiona la comunicación con la cola existente en Azure

## Configuración necesaria

Para que la integración funcione correctamente, se requieren las siguientes variables de entorno:

```
REACT_APP_API_URL=http://tu-api-backend.com  # URL del backend que maneja la cola
REACT_APP_AZURE_QUEUE_NAME=solicitudes-chatgpt  # Nombre exacto de la cola existente en Azure
```

Estas variables deben configurarse en el archivo `.env` del proyecto o a través de las variables de entorno del servidor.

## Flujo de trabajo

1. El usuario envía una solicitud a Azure OpenAI
2. Si se recibe un error 429, el sistema:
   - Crea un objeto con los datos de la solicitud
   - Envía este objeto a la cola existente usando el servicio azureQueueService
   - Muestra un mensaje al usuario indicando que su solicitud está en cola
   - Proporciona un ID único de solicitud para seguimiento
3. El backend (fuera del ámbito de este código) procesa las solicitudes de la cola cuando hay disponibilidad
4. El frontend consulta periódicamente el estado de la solicitud encolada
5. Cuando la solicitud es procesada, se muestra el resultado al usuario

## Manejo de errores

El sistema está diseñado para mostrar errores directamente cuando:
- No se puede conectar con el backend
- El servicio de cola no está disponible
- Hay problemas con la cola de Azure

Esto permite identificar y solucionar rápidamente problemas de infraestructura o configuración sin simulaciones que oculten los errores reales.

## Verificación de estado

El componente consulta automáticamente el estado de las solicitudes encoladas cada 10 segundos. Además, proporciona un botón para verificar manualmente el estado cuando sea necesario.

## Próximos pasos recomendados

1. Configurar correctamente las variables de entorno para apuntar a la cola existente
2. Verificar que el backend esté configurado para procesar solicitudes de esta cola
3. Implementar pruebas de integración para validar el flujo completo
4. Configurar monitores y alertas para el tamaño de la cola 