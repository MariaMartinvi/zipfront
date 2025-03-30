const ChatAnalyzer = {
  init(config = {}) {
    console.log('ChatAnalyzer inicializado:', config);
    // Resto de la lógica de inicialización
    return this;
  },
  
  analyzeChatOperation(operationId) {
    console.log('Analizando operación:', operationId);
    
    // Get the API URL from environment variables or use fallback
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    
    // Implementa la lógica para llamar a la API con la URL completa
    return fetch(`${API_URL}/api/analyze-chat/${operationId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error al analizar chat: ${response.status} ${response.statusText}`);
        }
        return response.json();
      });
  },
  
  analyzeChatText(text) {
    console.log('Analizando texto:', text.substring(0, 50) + '...');
    
    // Get the API URL from environment variables or use fallback
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    
    // Implementa la lógica para llamar a la API con la URL completa
    return fetch(`${API_URL}/api/analyze-chat-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error al analizar texto: ${response.status} ${response.statusText}`);
        }
        return response.json();
      });
  },
  
  renderResults(results, containerId = 'analysisResults') {
    console.log('Renderizando resultados:', results);
    // Implementa la lógica para mostrar los resultados
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<h3>Análisis completado</h3><pre>' + 
                            JSON.stringify(results, null, 2) + '</pre>';
    }
  }
};

export default ChatAnalyzer;