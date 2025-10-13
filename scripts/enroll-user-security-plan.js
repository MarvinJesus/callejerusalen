#!/usr/bin/env node

/**
 * Script para inscribir un usuario en el Plan de Seguridad de la Comunidad
 * 
 * Uso:
 * node scripts/enroll-user-security-plan.js [email]
 * 
 * Ejemplo:
 * node scripts/enroll-user-security-plan.js residente@demo.com
 */

const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function enrollUserInSecurityPlan(email) {
  try {
    console.log(`\n🔍 Buscando usuario con email: ${email}`);
    
    // Buscar usuario por email
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log(`✅ Usuario encontrado: ${userData.displayName}`);
    console.log(`   Rol: ${userData.role}`);
    console.log(`   Estado: ${userData.status}`);
    
    // Verificar que el usuario sea de tipo comunidad
    if (userData.role !== 'comunidad' && userData.role !== 'admin' && userData.role !== 'super_admin') {
      console.log('❌ Solo los residentes pueden inscribirse en el Plan de Seguridad');
      return;
    }

    // Verificar si ya está inscrito en securityRegistrations
    const existingRegistrations = await db.collection('securityRegistrations')
      .where('userId', '==', userId)
      .get();

    if (!existingRegistrations.empty) {
      const registration = existingRegistrations.docs[0].data();
      console.log('⚠️  El usuario ya está inscrito en el Plan de Seguridad');
      console.log(`   Estado: ${registration.status}`);
      console.log(`   Fecha de inscripción: ${registration.submittedAt?.toDate?.() || 'N/A'}`);
      return;
    }

    // Crear registro en la colección securityRegistrations
    const registrationData = {
      userId: userId,
      userDisplayName: userData.displayName || '',
      userEmail: userData.email || '',
      phoneNumber: '000-000-0000', // Placeholder - debería ser proporcionado
      address: 'Dirección no especificada', // Placeholder - debería ser proporcionado
      availability: 'full_time',
      skills: ['other'],
      otherSkills: 'Inscripción manual por script',
      status: 'active', // Directamente aprobado
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: 'system',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewNotes: 'Inscripción aprobada automáticamente por script',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('securityRegistrations').add(registrationData);

    console.log('\n✅ Usuario inscrito exitosamente en el Plan de Seguridad');
    console.log('   Ahora tiene acceso a:');
    console.log('   - Cámaras de Seguridad');
    console.log('   - Botón de Pánico');
    console.log('   - Alertas Comunitarias');

  } catch (error) {
    console.error('❌ Error al inscribir usuario:', error);
    throw error;
  }
}

async function enrollAllCommunityUsers() {
  try {
    console.log('\n🔍 Buscando todos los usuarios de la comunidad...');
    
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'comunidad')
      .get();
    
    console.log(`✅ Encontrados ${usersSnapshot.size} usuarios de la comunidad`);
    
    let enrolled = 0;
    let alreadyEnrolled = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Verificar si ya está inscrito en securityRegistrations
      const existingRegistrations = await db.collection('securityRegistrations')
        .where('userId', '==', userId)
        .get();

      if (!existingRegistrations.empty) {
        alreadyEnrolled++;
        continue;
      }

      // Crear registro en securityRegistrations
      const registrationData = {
        userId: userId,
        userDisplayName: userData.displayName || '',
        userEmail: userData.email || '',
        phoneNumber: '000-000-0000', // Placeholder
        address: 'Dirección no especificada', // Placeholder
        availability: 'full_time',
        skills: ['other'],
        otherSkills: 'Inscripción masiva por script',
        status: 'active', // Directamente aprobado
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: 'system',
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewNotes: 'Inscripción aprobada automáticamente por script masivo',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('securityRegistrations').add(registrationData);

      enrolled++;
      console.log(`✅ Inscrito: ${userData.email}`);
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Usuarios inscritos: ${enrolled}`);
    console.log(`   - Ya inscritos: ${alreadyEnrolled}`);
    console.log(`   - Total: ${usersSnapshot.size}`);

  } catch (error) {
    console.error('❌ Error al inscribir usuarios:', error);
    throw error;
  }
}

// Ejecutar script
async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log(`
📋 Uso:
   node scripts/enroll-user-security-plan.js <email>
   node scripts/enroll-user-security-plan.js --all

📝 Ejemplos:
   node scripts/enroll-user-security-plan.js residente@demo.com
   node scripts/enroll-user-security-plan.js --all

🔍 Descripción:
   Inscribe un usuario en el Plan de Seguridad de la Comunidad,
   otorgándole acceso a funciones de seguridad.
    `);
    process.exit(0);
  }

  try {
    if (email === '--all') {
      await enrollAllCommunityUsers();
    } else {
      await enrollUserInSecurityPlan(email);
    }
    
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error.message);
    process.exit(1);
  }
}

main();

