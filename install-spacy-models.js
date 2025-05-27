/**
 * Script para instalar modelos de spaCy necesarios para anonimización multiidioma
 * Ejecutar con: node install-spacy-models.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Modelos de spaCy requeridos por idioma
const SPACY_MODELS = {
  'es_core_news_sm': 'Español',
  'en_core_web_sm': 'Inglés', 
  'de_core_news_sm': 'Alemán',
  'fr_core_news_sm': 'Francés',
  'it_core_news_sm': 'Italiano'
};

console.log('🚀 Instalando modelos de spaCy para anonimización multiidioma...\n');

/**
 * Verifica si Python está instalado
 */
function checkPython() {
  return new Promise((resolve) => {
    const python = spawn('python', ['--version']);
    python.on('close', (code) => {
      if (code === 0) {
        resolve('python');
      } else {
        const python3 = spawn('python3', ['--version']);
        python3.on('close', (code3) => {
          resolve(code3 === 0 ? 'python3' : null);
        });
      }
    });
  });
}

/**
 * Verifica si spaCy está instalado
 */
function checkSpacy(pythonCmd) {
  return new Promise((resolve) => {
    const spacy = spawn(pythonCmd, ['-c', 'import spacy; print(spacy.__version__)']);
    spacy.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Instala spaCy
 */
function installSpacy(pythonCmd) {
  return new Promise((resolve, reject) => {
    console.log('📦 Instalando spaCy...');
    const pip = spawn(pythonCmd, ['-m', 'pip', 'install', 'spacy'], { stdio: 'inherit' });
    
    pip.on('close', (code) => {
      if (code === 0) {
        console.log('✅ spaCy instalado correctamente\n');
        resolve();
      } else {
        reject(new Error('Error instalando spaCy'));
      }
    });
  });
}

/**
 * Verifica si un modelo específico está instalado
 */
function checkModel(pythonCmd, modelName) {
  return new Promise((resolve) => {
    const check = spawn(pythonCmd, ['-c', `import spacy; nlp = spacy.load('${modelName}'); print('OK')`]);
    check.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Instala un modelo específico de spaCy
 */
function installModel(pythonCmd, modelName, language) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Instalando modelo para ${language} (${modelName})...`);
    
    const install = spawn(pythonCmd, ['-m', 'spacy', 'download', modelName], { 
      stdio: 'inherit' 
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Modelo ${modelName} instalado correctamente\n`);
        resolve();
      } else {
        console.log(`❌ Error instalando ${modelName}\n`);
        reject(new Error(`Error instalando modelo ${modelName}`));
      }
    });
  });
}

/**
 * Función principal
 */
async function main() {
  try {
    // 1. Verificar Python
    console.log('🔍 Verificando instalación de Python...');
    const pythonCmd = await checkPython();
    
    if (!pythonCmd) {
      throw new Error('Python no está instalado. Por favor instala Python 3.6+ desde https://python.org');
    }
    
    console.log(`✅ Python encontrado: ${pythonCmd}\n`);

    // 2. Verificar spaCy
    console.log('🔍 Verificando instalación de spaCy...');
    const spacyInstalled = await checkSpacy(pythonCmd);
    
    if (!spacyInstalled) {
      await installSpacy(pythonCmd);
    } else {
      console.log('✅ spaCy ya está instalado\n');
    }

    // 3. Instalar modelos
    console.log('🔍 Verificando e instalando modelos de idiomas...\n');
    
    const installationResults = {};
    
    for (const [modelName, language] of Object.entries(SPACY_MODELS)) {
      try {
        console.log(`Verificando modelo para ${language}...`);
        const modelInstalled = await checkModel(pythonCmd, modelName);
        
        if (!modelInstalled) {
          await installModel(pythonCmd, modelName, language);
          installationResults[modelName] = 'instalado';
        } else {
          console.log(`✅ Modelo ${modelName} ya está instalado\n`);
          installationResults[modelName] = 'ya_instalado';
        }
      } catch (error) {
        console.log(`⚠️  No se pudo instalar ${modelName}: ${error.message}\n`);
        installationResults[modelName] = 'error';
      }
    }

    // 4. Crear archivo de configuración
    const configPath = path.join(__dirname, 'spacy-config.json');
    const config = {
      python_command: pythonCmd,
      installed_models: installationResults,
      installation_date: new Date().toISOString(),
      status: 'completed'
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // 5. Resumen final
    console.log('🎉 INSTALACIÓN COMPLETADA\n');
    console.log('═══════════════════════════════════════');
    
    const successful = Object.values(installationResults).filter(status => 
      status === 'instalado' || status === 'ya_instalado'
    ).length;
    
    const failed = Object.values(installationResults).filter(status => 
      status === 'error'
    ).length;
    
    console.log(`✅ Modelos disponibles: ${successful}/${Object.keys(SPACY_MODELS).length}`);
    if (failed > 0) {
      console.log(`❌ Modelos con errores: ${failed}`);
    }
    
    console.log('\n📋 RESUMEN POR IDIOMA:');
    for (const [modelName, language] of Object.entries(SPACY_MODELS)) {
      const status = installationResults[modelName];
      const emoji = status === 'error' ? '❌' : '✅';
      console.log(`   ${emoji} ${language}: ${modelName} (${status})`);
    }
    
    console.log('\n📝 Configuración guardada en: spacy-config.json');
    console.log('\n🚀 Ahora puedes usar el servicio de anonimización multiidioma!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 SOLUCIONES POSIBLES:');
    console.log('   1. Instala Python 3.6+ desde https://python.org');
    console.log('   2. Asegúrate de que pip esté actualizado: python -m pip install --upgrade pip');
    console.log('   3. Si tienes problemas de permisos, usa: python -m pip install --user spacy');
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main, checkPython, checkSpacy, SPACY_MODELS }; 