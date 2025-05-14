/**
 * TensorFlowAnalyzer.js
 * Módulo para análisis de chat usando IA
 * Ahora utiliza AIAnalyzer.js con DistilBERT para generar análisis real
 */

import * as tf from '@tensorflow/tfjs';
import { useEffect, useState } from 'react';
// Importar AIAnalyzer para análisis basado en IA real
import AIAnalyzer, { useAIAnalyzer } from './AIAnalyzer';

// Configuración global para TensorFlow
tf.setBackend('webgl');
tf.enableProdMode(); // Para mejor rendimiento

// Mantener compatibilidad con el código existente
// Delegamos todo el procesamiento real al AIAnalyzer que usa DistilBERT
export function useTensorFlowAnalyzer(statistics) {
  return useAIAnalyzer(statistics);
}

// Exportar funciones necesarias para mantener compatibilidad
export default {
  useTensorFlowAnalyzer,
  // Exponer los métodos del AIAnalyzer
  generateFullAnalysis: AIAnalyzer.AIAnalyzer.generateFullAnalysis,
  extractParticipantFeatures: AIAnalyzer.extractParticipantFeatures
};