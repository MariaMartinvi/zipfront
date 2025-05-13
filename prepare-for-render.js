#!/usr/bin/env node

/**
 * Script para preparar el entorno para despliegue en Render
 * 
 * Este script:
 * 1. Crea la carpeta src/src si no existe
 * 2. Copia chatAnalyzer.js a src/src
 */

const fs = require('fs');
const path = require('path');

console.log("Iniciando preparación para Render...");

// Directorio base (src)
const srcDir = path.join(__dirname, 'src');

// Directorio destino (src/src)
const targetDir = path.join(srcDir, 'src');

// Verificar si existe la carpeta src/src
if (!fs.existsSync(targetDir)) {
  console.log("Creando directorio src/src...");
  fs.mkdirSync(targetDir, { recursive: true });
}

// Archivos clave a copiar
const filesToCopy = [
  { src: 'chatAnalyzer.js', dest: path.join(targetDir, 'chatAnalyzer.js') },
  { src: 'formatDetector.js', dest: path.join(targetDir, 'formatDetector.js') }
];

// Copiar archivos
for (const file of filesToCopy) {
  const sourcePath = path.join(srcDir, file.src);
  try {
    if (fs.existsSync(sourcePath)) {
      console.log(`Copiando ${file.src} a src/src/...`);
      const content = fs.readFileSync(sourcePath, 'utf8');
      fs.writeFileSync(file.dest, content);
      console.log(`✅ ${file.src} copiado correctamente`);
    } else {
      console.error(`❌ No se encuentra ${file.src} en src/`);
    }
  } catch (error) {
    console.error(`❌ Error copiando ${file.src}:`, error);
  }
}

// Crear archivo de respaldo
const backupContent = `/**
 * ARCHIVO DE RESPALDO - Creado para resolver error de Render
 */

// Reexportar desde el archivo original
export { analizarChat, encontrarArchivosChat } from '../chatAnalyzer.js';`;

try {
  fs.writeFileSync(path.join(targetDir, 'chatAnalyzer.js'), backupContent);
  console.log("✅ Archivo de respaldo creado correctamente");
} catch (error) {
  console.error("❌ Error creando archivo de respaldo:", error);
}

console.log("Preparación para Render completada."); 