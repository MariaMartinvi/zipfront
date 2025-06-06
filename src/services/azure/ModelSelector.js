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
  // Ahora usamos gpt-4o como modelo principal que tiene mejor rendimiento
  // que gpt-4o-mini para análisis psicológicos complejos.
  
  console.log(`Seleccionando modelo óptimo para texto de ${textLength} caracteres`);
  
  // Exactamente igual que en backend (chatgpt_integration.py)
  return {
    model: "gpt-4o",
    temperature: 0.5  // Temperatura reducida para mayor consistencia
  };
};

export default selectOptimalModel; 