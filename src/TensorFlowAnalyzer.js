/**
 * TensorFlowAnalyzer.js
 * Módulo para análisis de chat usando IA
 * Ahora utiliza AIAnalyzerLocal.js con modelo Davlan para pruebas experimentales
 */

import * as tf from '@tensorflow/tfjs';
import { useEffect, useState } from 'react';
// Importar AIAnalyzerLocal para pruebas experimentales
import AIAnalyzerLocal, { useAIAnalyzerLocal } from './AIAnalyzerLocal';
// Mantener también el AIAnalyzer original para poder elegir
import AIAnalyzer, { useAIAnalyzer } from './AIAnalyzer';

// Configuración global para TensorFlow
tf.setBackend('webgl');
tf.enableProdMode(); // Para mejor rendimiento

// Bandera para cambiar entre modelo experimental y oficial
const USE_EXPERIMENTAL_MODEL = true;

// Función wrapper para usar el análisis de IA
export function useTensorFlowAnalyzer(statistics) {
  // Siempre usar el mismo hook, sin condiciones
  const result = useAIAnalyzer(statistics);
  
  // La lógica condicional puede ir después de llamar al hook
  return result;
}

// Para usar específicamente el modelo experimental para pruebas de nombres
export function useNameDetectionTest(message) {
  return useAIAnalyzerLocal(message);
}

// Exportar funciones necesarias para mantener compatibilidad
export default {
  useTensorFlowAnalyzer,
  useNameDetectionTest,
  // Exponer los métodos del analizador activo
  generateFullAnalysis: USE_EXPERIMENTAL_MODEL 
    ? AIAnalyzerLocal.AIAnalyzerLocal.generateFullAnalysis 
    : AIAnalyzer.AIAnalyzer.generateFullAnalysis,
  extractParticipantFeatures: AIAnalyzer.extractParticipantFeatures
};