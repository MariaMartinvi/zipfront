/**
 * ModelSelector.js - Selector de modelos para Azure
 * 
 * Este módulo implementa la lógica para seleccionar el modelo óptimo de Azure
 * basado en la longitud del texto y otros parámetros.
 */

import { TEXT_LENGTH_LIMITS } from './constants';

/**
 * Selecciona el modelo óptimo basado en la longitud del texto
 * @param {number} textLength - Longitud del texto en caracteres
 * @returns {Object} - Objeto con el modelo y configuración de temperatura
 */
export const selectOptimalModel = (textLength) => {
  // Por ahora, usamos exclusivamente gpt-4o-mini que tiene la mejor cuota disponible (100K TPM)
  // y buen rendimiento para todos los tipos de contenido.
  
  console.log(`Seleccionando modelo óptimo para texto de ${textLength} caracteres`);
  
  // Exactamente igual que en backend (chatgpt_integration.py)
  return {
    model: "gpt-4o-mini",
    temperature: 0.5  // Temperatura reducida para mayor consistencia
  };
};

export default selectOptimalModel; 