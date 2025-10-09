#!/usr/bin/env node

/**
 * Script para migrar permisos de usuarios
 * Convierte users.activate y users.deactivate a users.manage_status
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateUserPermissions() {
  console.log('🔄 Iniciando migración de permisos de usuarios...');

  try {
    // Obtener todos los usuarios
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No se encontraron usuarios para migrar');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const currentPermissions = userData.permissions || [];
      
      // Verificar si tiene los permisos antiguos
      const hasOldPermissions = currentPermissions.includes('users.activate') || 
                               currentPermissions.includes('users.deactivate');
      
      if (!hasOldPermissions) {
        skippedCount++;
        continue;
      }

      // Crear nuevo array de permisos
      const newPermissions = [...currentPermissions];
      
      // Remover permisos antiguos
      const activateIndex = newPermissions.indexOf('users.activate');
      if (activateIndex > -1) {
        newPermissions.splice(activateIndex, 1);
      }
      
      const deactivateIndex = newPermissions.indexOf('users.deactivate');
      if (deactivateIndex > -1) {
        newPermissions.splice(deactivateIndex, 1);
      }
      
      // Agregar nuevo permiso si no existe
      if (!newPermissions.includes('users.manage_status')) {
        newPermissions.push('users.manage_status');
      }

      // Actualizar usuario en Firestore
      await userDoc.ref.update({
        permissions: newPermissions,
        updatedAt: new Date()
      });

      console.log(`✅ Usuario migrado: ${userData.email}`);
      console.log(`   Antes: ${currentPermissions.join(', ')}`);
      console.log(`   Después: ${newPermissions.join(', ')}`);
      
      migratedCount++;
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`✅ Usuarios migrados: ${migratedCount}`);
    console.log(`⏭️  Usuarios omitidos: ${skippedCount}`);
    console.log(`📝 Total procesados: ${usersSnapshot.size}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verificando migración...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    
    let usersWithOldPermissions = 0;
    let usersWithNewPermissions = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const permissions = userData.permissions || [];
      
      if (permissions.includes('users.activate') || permissions.includes('users.deactivate')) {
        usersWithOldPermissions++;
        console.log(`⚠️  Usuario con permisos antiguos: ${userData.email}`);
      }
      
      if (permissions.includes('users.manage_status')) {
        usersWithNewPermissions++;
      }
    }
    
    console.log(`\n📊 Verificación completada:`);
    console.log(`❌ Usuarios con permisos antiguos: ${usersWithOldPermissions}`);
    console.log(`✅ Usuarios con nuevo permiso: ${usersWithNewPermissions}`);
    
    if (usersWithOldPermissions === 0) {
      console.log('🎉 ¡Migración exitosa! Todos los permisos han sido actualizados.');
    } else {
      console.log('⚠️  Aún hay usuarios con permisos antiguos. Ejecuta el script nuevamente.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

async function main() {
  console.log('🚀 Migrador de Permisos de Usuarios');
  console.log('=====================================\n');
  
  // Ejecutar migración
  await migrateUserPermissions();
  
  // Verificar migración
  await verifyMigration();
  
  console.log('\n✨ Proceso completado');
  process.exit(0);
}

// Ejecutar script
main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
