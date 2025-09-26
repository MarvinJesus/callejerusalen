#!/usr/bin/env node

/**
 * Script para inicializar permisos por defecto en el sistema
 * Ejecutar con: node scripts/init-permissions.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de Firebase Admin
const initializeFirebaseAdmin = () => {
  try {
    // Intentar usar archivo JSON primero
    const serviceAccountPath = './firebase-service-account.json';
    
    if (fs.existsSync(serviceAccountPath)) {
      console.log('📁 Usando archivo de credenciales:', serviceAccountPath);
      const serviceAccount = require(path.resolve(serviceAccountPath));
      
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      const db = getFirestore(app);
      return { app, db };
    }
    
    // Fallback: usar variables de entorno
    console.log('🔧 Usando variables de entorno...');
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    // Verificar que todas las variables de entorno estén presentes
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.error('❌ Error: No se encontró archivo de credenciales ni variables de entorno');
      console.error('   Opciones:');
      console.error('   1. Coloca el archivo firebase-service-account.json en la raíz del proyecto');
      console.error('   2. O configura las variables de entorno en .env.local');
      process.exit(1);
    }

    // Inicializar Firebase Admin
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    const db = getFirestore(app);
    
    return { app, db };
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
    process.exit(1);
  }
};

try {
  const { app, db } = initializeFirebaseAdmin();
  
  console.log('🔥 Firebase Admin inicializado correctamente');
  
  // Permisos por defecto para cada rol
  const defaultPermissions = {
    super_admin: [
      // Gestión de usuarios
      'users.view', 'users.create', 'users.edit', 'users.delete', 'users.activate', 'users.deactivate',
      // Gestión de roles
      'roles.view', 'roles.assign', 'permissions.view', 'permissions.assign',
      // Gestión de registros
      'registrations.view', 'registrations.approve', 'registrations.reject',
      // Sistema
      'system.view', 'system.configure', 'system.backup', 'system.restore',
      // Seguridad
      'security.view', 'security.monitor', 'security.alerts', 'security.cameras',
      // Reportes
      'reports.view', 'reports.export', 'analytics.view', 'analytics.export',
      // Logs
      'logs.view', 'logs.export', 'logs.delete',
      // Comunidad
      'community.view', 'community.edit', 'community.events', 'community.services', 'community.places'
    ],
    admin: [
      'users.view',
      'registrations.view',
      'security.view',
      'reports.view',
      'analytics.view',
      'logs.view',
      'community.view'
    ],
    comunidad: [],
    visitante: []
  };
  
  async function initializePermissions() {
    console.log('🚀 Iniciando configuración de permisos por defecto...');
    
    try {
      // Actualizar permisos por defecto en la base de datos
      for (const [role, permissions] of Object.entries(defaultPermissions)) {
        await db.collection('defaultPermissions').doc(role).set({
          role,
          permissions,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✅ Permisos por defecto configurados para rol: ${role} (${permissions.length} permisos)`);
      }
      
      // Actualizar usuarios existentes con permisos por defecto
      console.log('🔄 Actualizando usuarios existentes...');
      
      const usersSnapshot = await db.collection('users').get();
      let updatedUsers = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userRole = userData.role || 'visitante';
        const defaultUserPermissions = defaultPermissions[userRole] || [];
        
        // Solo actualizar si no tiene permisos o si es super_admin (para asegurar todos los permisos)
        if (!userData.permissions || userRole === 'super_admin') {
          await userDoc.ref.update({
            permissions: defaultUserPermissions,
            updatedAt: new Date()
          });
          
          updatedUsers++;
          console.log(`   ✅ Usuario ${userData.email} (${userRole}) actualizado con ${defaultUserPermissions.length} permisos`);
        } else {
          console.log(`   ⏭️  Usuario ${userData.email} ya tiene permisos asignados, omitiendo`);
        }
      }
      
      console.log(`\n🎉 Configuración completada exitosamente!`);
      console.log(`   📊 Roles configurados: ${Object.keys(defaultPermissions).length}`);
      console.log(`   👥 Usuarios actualizados: ${updatedUsers}`);
      console.log(`   📝 Total de permisos únicos: ${new Set(Object.values(defaultPermissions).flat()).size}`);
      
      // Mostrar resumen de permisos
      console.log('\n📋 Resumen de permisos por rol:');
      for (const [role, permissions] of Object.entries(defaultPermissions)) {
        console.log(`   ${role}: ${permissions.length} permisos`);
        if (permissions.length > 0) {
          console.log(`      ${permissions.slice(0, 3).join(', ')}${permissions.length > 3 ? '...' : ''}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error durante la configuración:', error);
      throw error;
    }
  }
  
  // Ejecutar la inicialización
  initializePermissions()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en el script:', error);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin:', error);
  process.exit(1);
}
