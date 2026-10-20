// Extracción y anonimización básica del chat (teléfonos, correos, enlaces) al subirlo.
// Compartido por la portada (App.js) y la pantalla de chat de pareja.

export const extractChatContent = async (zipContent) => {
  try {
    let chatContent = null;
    let chatFileName = null;
    
    for (const zipEntry in zipContent.files) {
      if (zipEntry.toLowerCase().includes('_chat.txt') || 
          zipEntry.toLowerCase().endsWith('.txt')) {
        chatFileName = zipEntry;
        chatContent = await zipContent.files[zipEntry].async('string');
        break;
      }
    }
    
    if (!chatContent) {
      return { error: "No se encontró ningún archivo de chat" };
    }
    
    const chatAnonimizado = anonimizarChat(chatContent);
    
    return { 
      chat: chatAnonimizado,
      fileName: chatFileName,
      success: true
    };
  } catch (error) {
    return { 
      error: `Error extrayendo contenido: ${error.message}`,
      success: false
    };
  }
};

export const anonimizarChat = (contenido) => {
  if (!contenido) return contenido;
  
  try {
    const reemplazosEmails = {};
    const reemplazosNumeros = {};
    let totalUrlsAnonimizadas = 0;
    
    const anonimizarNumero = (numeroStr) => {
      const numeroLimpio = numeroStr.replace(/[\s.-]/g, '');
      
      if (reemplazosNumeros[numeroLimpio]) {
        return reemplazosNumeros[numeroLimpio];
      }
      
      const numDigitos = numeroLimpio.length;
      const digitosAMantener = Math.max(2, Math.floor(numDigitos / 2));
      const resultado = numeroLimpio.substring(0, digitosAMantener) + 'X'.repeat(numDigitos - digitosAMantener);
      
      reemplazosNumeros[numeroLimpio] = resultado;
      return resultado;
    };
    
    const anonimizarEmail = (email) => {
      if (reemplazosEmails[email]) {
        return reemplazosEmails[email];
      }
      
      const dominioMatch = email.match(/@([\w.-]+)/);
      let anonimizado;
      
      if (dominioMatch) {
        const dominio = dominioMatch[1];
        anonimizado = `email_anon@${dominio}`;
      } else {
        anonimizado = "email_anon@domain.com";
      }
      
      reemplazosEmails[email] = anonimizado;
      return anonimizado;
    };

    // Función para anonimizar URLs manteniendo solo el protocolo
    const detectarYAnonimizarUrls = (texto) => {
      // Patrón para detectar URLs completas
      const patronUrl = /(https?:\/\/[^\s]+)/gi;
      
      let textoAnonimizado = texto;
      const matches = textoAnonimizado.match(patronUrl);
      
      if (matches) {
        for (const url of matches) {
          // Extraer solo el protocolo (http:// o https://)
          const protocoloMatch = url.match(/^(https?:\/\/)/i);
          if (protocoloMatch) {
            const protocolo = protocoloMatch[1].toLowerCase();
            // Reemplazar toda la URL con solo el protocolo
            textoAnonimizado = textoAnonimizado.replace(url, protocolo);
            totalUrlsAnonimizadas++;
          }
        }
      }
      
      return textoAnonimizado;
    };
    
    // Detectar y anonimizar números de teléfono y similares
    const detectarYAnonimizarNumeros = (texto) => {
      // Patrones para detectar fechas completas (Android e iOS)
      const patronesFechas = [
        // Formatos de fecha estándar
        /\d{1,2}\/\d{1,2}\/\d{2,4}/g,     // DD/MM/YYYY o MM/DD/YYYY (ej: 17/12/23)
        /\d{1,2}-\d{1,2}-\d{2,4}/g,       // DD-MM-YYYY o MM-DD-YYYY  
        /\d{2,4}\/\d{1,2}\/\d{1,2}/g,     // YYYY/MM/DD
        /\d{2,4}-\d{1,2}-\d{1,2}/g,       // YYYY-MM-DD
        
        // Formatos de hora
        /\d{1,2}:\d{1,2}:\d{1,2}/g,       // HH:MM:SS (horas) (ej: 14:26:19)
        /\d{1,2}:\d{1,2}/g,               // HH:MM (horas)
        
        // Formatos específicos de WhatsApp con corchetes
        /\[\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{1,2}:\d{1,2}\]/g,  // [DD/MM/YY, HH:MM:SS]
        /\[\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{1,2}\]/g,          // [DD/MM/YY, HH:MM]
        /\[\d{1,2}-\d{1,2}-\d{2,4},\s*\d{1,2}:\d{1,2}:\d{1,2}\]/g,    // [DD-MM-YY, HH:MM:SS]
        /\[\d{1,2}-\d{1,2}-\d{2,4},\s*\d{1,2}:\d{1,2}\]/g,            // [DD-MM-YY, HH:MM]
        
        // Timestamps completos de WhatsApp (sin corchetes para detectar partes)
        /\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{1,2}:\d{1,2}/g,      // DD/MM/YY, HH:MM:SS
        /\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{1,2}/g,              // DD/MM/YY, HH:MM
        /\d{1,2}-\d{1,2}-\d{2,4},\s*\d{1,2}:\d{1,2}:\d{1,2}/g,        // DD-MM-YY, HH:MM:SS
        /\d{1,2}-\d{1,2}-\d{2,4},\s*\d{1,2}:\d{1,2}/g,                // DD-MM-YY, HH:MM

        // Timestamps SIN coma entre fecha y hora (export de iOS: "[30/1/26 13:56:06]").
        // Sin esta protección, "26 13" se detecta como número de teléfono y el
        // timestamp queda corrupto ("26XX"), rompiendo el análisis del chat.
        /\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{1,2}(?::\d{1,2})?/g,  // DD/MM/YY HH:MM(:SS)
        /\d{1,2}[.-]\d{1,2}[.-]\d{2,4}\s+\d{1,2}:\d{1,2}(?::\d{1,2})?/g // DD.MM.YY HH:MM(:SS)
      ];
      
      // Crear un conjunto de todas las fechas encontradas para protegerlas
      const fechasProtegidas = new Set();
      
      // Encontrar todas las fechas en el texto y marcarlas como protegidas
      patronesFechas.forEach(patron => {
        const matches = texto.match(patron);
        if (matches) {
          matches.forEach(fecha => fechasProtegidas.add(fecha));
        }
      });
      
      // Patrón para encontrar cualquier número (con o sin separadores)
      const patronNumeros = /\d+(?:[\s.-]\d+)*/g;
      
      let textoAnonimizado = texto;
      const matches = textoAnonimizado.match(patronNumeros);
      
      if (matches) {
        for (const match of matches) {
          // Verificar si este número es parte de una fecha protegida
          let esParteDeFecha = false;
          for (const fecha of fechasProtegidas) {
            if (fecha.includes(match)) {
              esParteDeFecha = true;
              break;
            }
          }
          
          // Saltar si es parte de una fecha
          if (esParteDeFecha) {
            continue;
          }
          
          // Limpiar el número (quitar espacios, puntos, guiones)
          const numeroLimpio = match.replace(/[^0-9]/g, '');
          const numDigitos = numeroLimpio.length;
          
          // Determinar cuántos dígitos mantener
          let digitosAMantener;
          if (numDigitos === 1) {
            digitosAMantener = 0; // Se reemplazará todo con X
          } else if (numDigitos === 2) {
            digitosAMantener = 1; // Mantener 1 dígito
          } else if (numDigitos === 3) {
            digitosAMantener = 1; // Mantener 1 dígito
          } else {
            digitosAMantener = Math.ceil(numDigitos / 2); // Mitad de dígitos
          }
          
          // Construir el resultado
          const resultado = numeroLimpio.substring(0, digitosAMantener) + 'X'.repeat(numDigitos - digitosAMantener);
          
          // Reemplazar en el texto original
          textoAnonimizado = textoAnonimizado.replace(match, resultado);
        }
      }
      
      return textoAnonimizado;
    };
    
    // Detectar y anonimizar correos electrónicos
    const detectarYAnonimizarEmails = (texto) => {
      // Patrón para emails
      const patronEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      
      let textoAnonimizado = texto;
      const matches = textoAnonimizado.match(patronEmail);
      
      if (matches) {
        for (const email of matches) {
          const anonimizado = anonimizarEmail(email);
          textoAnonimizado = textoAnonimizado.split(email).join(anonimizado);
        }
      }
      
      return textoAnonimizado;
    };
    
    // Dividir el texto en líneas para procesarlo línea por línea
    const lineas = contenido.split(/\r?\n/);
    const lineasAnonimizadas = [];
    
    for (let linea of lineas) {
      // Primero anonimizar los emails
      linea = detectarYAnonimizarEmails(linea);
      
      // Luego anonimizar URLs
      linea = detectarYAnonimizarUrls(linea);
      
      // Finalmente anonimizar números
      linea = detectarYAnonimizarNumeros(linea);
      
      lineasAnonimizadas.push(linea);
    }
    
    // Unir las líneas en un solo texto
    const contenidoAnonimizado = lineasAnonimizadas.join('\n');
    
    // Registrar las estadísticas de anonimización
    const totalEmails = Object.keys(reemplazosEmails).length;
    const totalNumeros = Object.keys(reemplazosNumeros).length;
    console.log(`Anonimización completada: ${totalEmails} emails, ${totalUrlsAnonimizadas} URLs y ${totalNumeros} números anonimizados`);
    
    return contenidoAnonimizado;
  } catch (error) {
    console.error("Error al anonimizar el chat:", error);
    return contenido; // En caso de error, devolver el contenido original
  }
};
