const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Datos de ejemplo para registros del plan de seguridad
const sampleRegistrations = [
  {
    userId: 'sample-user-1',
    userDisplayName: 'María González',
    userEmail: 'maria.gonzalez@example.com',
    phoneNumber: '+57 300 123 4567',
    address: 'Calle 123 #45-67, Sector A',
    availability: '24/7',
    skills: ['Primeros auxilios', 'Comunicación', 'Liderazgo'],
    otherSkills: 'Experiencia en coordinación de emergencias',
    status: 'active',
    sector: 'Sector A',
    submittedAt: new Date('2024-01-15'),
    reviewedBy: 'admin@callejerusalen.com',
    reviewedAt: new Date('2024-01-16'),
    reviewNotes: 'Aprobado - Excelente perfil para el plan de seguridad',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16')
  },
  {
    userId: 'sample-user-2',
    userDisplayName: 'Carlos Rodríguez',
    userEmail: 'carlos.rodriguez@example.com',
    phoneNumber: '+57 310 987 6543',
    address: 'Calle 456 #78-90, Sector B',
    availability: 'mañanas',
    skills: ['Seguridad ciudadana', 'Tecnología', 'Vigilancia'],
    otherSkills: 'Conocimientos en sistemas de seguridad',
    status: 'active',
    sector: 'Sector B',
    submittedAt: new Date('2024-01-20'),
    reviewedBy: 'admin@callejerusalen.com',
    reviewedAt: new Date('2024-01-21'),
    reviewNotes: 'Aprobado - Buen perfil técnico',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-21')
  },
  {
    userId: 'sample-user-3',
    userDisplayName: 'Ana Martínez',
    userEmail: 'ana.martinez@example.com',
    phoneNumber: '+57 315 555 1234',
    address: 'Calle 789 #12-34, Sector C',
    availability: 'tardes',
    skills: ['Emergencias médicas', 'Coordinación', 'Comunicación'],
    otherSkills: 'Enfermera con experiencia en emergencias',
    status: 'active',
    sector: 'Sector C',
    submittedAt: new Date('2024-02-01'),
    reviewedBy: 'admin@callejerusalen.com',
    reviewedAt: new Date('2024-02-02'),
    reviewNotes: 'Aprobado - Perfil médico muy valioso',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-02')
  },
  {
    userId: 'sample-user-4',
    userDisplayName: 'Luis Pérez',
    userEmail: 'luis.perez@example.com',
    phoneNumber: '+57 320 777 8888',
    address: 'Calle 321 #56-78, Sector A',
    availability: 'noches',
    skills: ['Seguridad ciudadana', 'Liderazgo', 'Vigilancia'],
    otherSkills: 'Ex-militar con experiencia en seguridad',
    status: 'pending',
    sector: 'Sector A',
    submittedAt: new Date('2024-02-10'),
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  }
];

async function createSampleRegistrations() {
  console.log('🔄 Creando registros de ejemplo para el Plan de Seguridad...\n');

  try {
    // Verificar si ya existen registros
    const registrationsRef = collection(db, 'securityRegistrations');
    const existingQuery = query(registrationsRef);
    const existingSnapshot = await getDocs(existingQuery);
    
    if (existingSnapshot.size > 0) {
      console.log(`⚠️ Ya existen ${existingSnapshot.size} registros en la colección.`);
      console.log('   ¿Deseas continuar y agregar registros adicionales? (S/N)');
      // En un script automatizado, continuamos
    }

    console.log('📝 Creando registros de ejemplo...\n');
    
    let createdCount = 0;
    let errorCount = 0;

    for (const registrationData of sampleRegistrations) {
      try {
        console.log(`   📄 Creando registro para: ${registrationData.userDisplayName}`);
        console.log(`      - Email: ${registrationData.userEmail}`);
        console.log(`      - Status: ${registrationData.status}`);
        console.log(`      - Sector: ${registrationData.sector}`);
        console.log(`      - Habilidades: ${registrationData.skills.join(', ')}`);
        
        const docRef = await addDoc(registrationsRef, registrationData);
        console.log(`      ✅ Creado exitosamente con ID: ${docRef.id}`);
        createdCount++;
        
      } catch (error) {
        console.error(`      ❌ Error creando registro:`, error.message);
        errorCount++;
      }
    }

    // Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`   - Registros creados: ${createdCount}`);
    console.log(`   - Errores: ${errorCount}`);
    
    if (createdCount > 0) {
      console.log('\n✅ ¡Registros de ejemplo creados exitosamente!');
      console.log('   Ahora puedes probar la funcionalidad del plan de seguridad.');
    }

  } catch (error) {
    console.error('❌ Error creando registros de ejemplo:', error);
  }
}

// Función para verificar los registros creados
async function verifyCreatedRegistrations() {
  console.log('\n🔍 Verificando registros creados...\n');

  try {
    const registrationsRef = collection(db, 'securityRegistrations');
    const allQuery = query(registrationsRef);
    const snapshot = await getDocs(allQuery);
    
    console.log(`📋 Total de registros en la colección: ${snapshot.size}\n`);
    
    let activeCount = 0;
    let pendingCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   📄 ${data.userDisplayName} (${data.userEmail})`);
      console.log(`      - Status: ${data.status}`);
      console.log(`      - Teléfono: ${data.phoneNumber}`);
      console.log(`      - Dirección: ${data.address}`);
      console.log(`      - Disponibilidad: ${data.availability}`);
      console.log(`      - Habilidades: ${data.skills.join(', ')}`);
      console.log(`      - Sector: ${data.sector || 'No especificado'}`);
      console.log('');
      
      if (data.status === 'active') activeCount++;
      else if (data.status === 'pending') pendingCount++;
    });
    
    console.log(`📊 ESTADO FINAL:`);
    console.log(`   - Usuarios activos: ${activeCount}`);
    console.log(`   - Usuarios pendientes: ${pendingCount}`);
    console.log(`   - Total: ${snapshot.size}`);
    
    if (activeCount > 0) {
      console.log('\n✅ ¡Perfecto! Ahora hay usuarios activos en el plan de seguridad.');
      console.log('   Estos usuarios aparecerán en la página de pánico.');
    }
    
  } catch (error) {
    console.error('❌ Error verificando registros:', error);
  }
}

// Ejecutar creación de registros de ejemplo
async function main() {
  await createSampleRegistrations();
  await verifyCreatedRegistrations();
  
  console.log('\n🏁 Proceso completado.');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

