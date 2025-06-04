#!/usr/bin/env node

// Script para establecer un usuario como administrador en Firebase
// Uso: node scripts/setAdmin.js <userId>

const admin = require('firebase-admin');
const path = require('path');

// Configurar Firebase Admin
const serviceAccount = require('../firebase-service-account.json'); // Necesitarás este archivo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
});

const db = admin.firestore();

async function setUserAsAdmin(userId, email = null) {
  try {
    console.log(`🔧 Estableciendo usuario ${userId} como administrador...`);
    
    if (!userId) {
      throw new Error('ID de usuario requerido');
    }
    
    const userRef = db.collection('users').doc(userId);
    
    // Verificar si el usuario existe
    const userDoc = await userRef.get();
    
    const updateData = {
      is_admin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (email) {
      updateData.email = email;
    }
    
    if (!userDoc.exists) {
      console.log('Usuario no encontrado, creando nuevo documento...');
      // Crear nuevo documento de usuario como administrador
      await userRef.set({
        email: email || 'unknown@email.com',
        is_admin: true,
        plan: 'free',
        currentPeriodUsage: 0,
        totalUploads: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Usuario ${userId} creado como administrador`);
    } else {
      // Actualizar usuario existente
      await userRef.update(updateData);
      console.log(`✅ Usuario ${userId} actualizado como administrador`);
    }
    
    // Verificar la actualización
    const updatedDoc = await userRef.get();
    const userData = updatedDoc.data();
    
    console.log('\n📊 Datos del usuario actualizado:');
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${userData.email || 'No email'}`);
    console.log(`   Es Admin: ${userData.is_admin}`);
    console.log(`   Plan: ${userData.plan}`);
    console.log(`   Uso actual: ${userData.currentPeriodUsage || 0}`);
    console.log(`   Total uploads: ${userData.totalUploads || 0}`);
    
    console.log('\n🎉 Usuario configurado exitosamente como administrador');
    console.log('   El usuario ahora tiene uploads ilimitados');
    
    return userData;
    
  } catch (error) {
    console.error('❌ Error estableciendo usuario como administrador:', error);
    throw error;
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Error: Debes proporcionar el UID del usuario');
    console.log('\nUso:');
    console.log('  node scripts/setAdmin.js <userId> [email]');
    console.log('\nEjemplo:');
    console.log('  node scripts/setAdmin.js "abc123xyz" "mariamartinvillaro@gmail.com"');
    console.log('\nPara encontrar el UID:');
    console.log('1. Ve a Firebase Console > Authentication > Users');
    console.log('2. Busca el email del usuario');
    console.log('3. Copia el UID de ese usuario');
    process.exit(1);
  }
  
  const userId = args[0];
  const email = args[1] || null;
  
  try {
    await setUserAsAdmin(userId, email);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { setUserAsAdmin }; 