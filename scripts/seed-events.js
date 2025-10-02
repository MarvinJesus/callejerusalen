const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

console.log('🌱 Iniciando poblamiento de datos de eventos...');

// Configuración de Firebase Admin
const serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore(app);

// Datos de ejemplo para eventos
const eventsData = [
  {
    title: 'Feria Comunitaria de Artesanías',
    description: 'Una celebración anual donde los artesanos locales muestran sus creaciones únicas. Incluye talleres, demostraciones y venta de productos artesanales.',
    date: '2024-12-15',
    time: '09:00',
    location: 'Parque Central de Calle Jerusalén',
    category: 'Cultural',
    type: 'Feria',
    organizer: 'Asociación de Artesanos de Calle Jerusalén',
    contact: '+1 (555) 123-4567',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    maxParticipants: 200,
    currentParticipants: 0,
    requirements: [
      'Entrada gratuita',
      'Traer ropa cómoda',
      'Se recomienda traer efectivo para compras'
    ],
    highlights: [
      'Más de 50 artesanos participantes',
      'Talleres gratuitos para niños',
      'Comida típica local',
      'Música en vivo'
    ],
    isRecurring: true,
    recurringPattern: 'Anual',
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Noche de Cuentos Tradicionales',
    description: 'Una velada mágica donde los ancianos de la comunidad comparten las historias y leyendas que han pasado de generación en generación.',
    date: '2024-11-30',
    time: '19:00',
    location: 'Centro Comunitario',
    category: 'Cultural',
    type: 'Entretenimiento',
    organizer: 'Grupo de Ancianos de Calle Jerusalén',
    contact: '+1 (555) 234-5678',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    maxParticipants: 80,
    currentParticipants: 0,
    requirements: [
      'Entrada gratuita',
      'Traer silla plegable si es necesario',
      'Se recomienda llegar temprano'
    ],
    highlights: [
      'Historias auténticas de la comunidad',
      'Ambiente familiar y acogedor',
      'Refrigerios tradicionales',
      'Participación de todas las edades'
    ],
    isRecurring: true,
    recurringPattern: 'Mensual',
    order: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Torneo de Fútbol Comunitario',
    description: 'Competencia deportiva anual que reúne a equipos de diferentes barrios. Incluye categorías para niños, jóvenes y adultos.',
    date: '2024-12-08',
    time: '08:00',
    location: 'Cancha Deportiva Municipal',
    category: 'Deportivo',
    type: 'Competencia',
    organizer: 'Liga Deportiva de Calle Jerusalén',
    contact: '+1 (555) 345-6789',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    maxParticipants: 120,
    currentParticipants: 0,
    requirements: [
      'Inscripción previa requerida',
      'Certificado médico vigente',
      'Equipo deportivo completo',
      'Cuota de inscripción: $10'
    ],
    highlights: [
      'Premios para los primeros lugares',
      'Categorías por edades',
      'Comida y bebidas disponibles',
      'Transmisión en vivo'
    ],
    isRecurring: true,
    recurringPattern: 'Anual',
    order: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Taller de Cocina Tradicional',
    description: 'Aprende a preparar los platillos típicos de la región con las recetas tradicionales que han pasado de generación en generación.',
    date: '2024-12-22',
    time: '14:00',
    location: 'Cocina Comunitaria',
    category: 'Educativo',
    type: 'Taller',
    organizer: 'Grupo de Mujeres Cocineras',
    contact: '+1 (555) 456-7890',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    maxParticipants: 25,
    currentParticipants: 0,
    requirements: [
      'Inscripción previa requerida',
      'Traer delantal y gorro de cocina',
      'Cuota de materiales: $15',
      'Edad mínima: 12 años'
    ],
    highlights: [
      'Recetas auténticas de la región',
      'Ingredientes frescos incluidos',
      'Degustación de los platillos preparados',
      'Recetario impreso incluido'
    ],
    isRecurring: true,
    recurringPattern: 'Bimensual',
    order: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Festival de Música Folclórica',
    description: 'Celebración de la música tradicional con presentaciones de grupos locales y regionales. Una noche llena de cultura y tradición.',
    date: '2024-12-28',
    time: '18:00',
    location: 'Plaza Principal',
    category: 'Cultural',
    type: 'Festival',
    organizer: 'Comité Cultural de Calle Jerusalén',
    contact: '+1 (555) 567-8901',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    maxParticipants: 300,
    currentParticipants: 0,
    requirements: [
      'Entrada gratuita',
      'Traer silla plegable',
      'Se permite comida y bebidas',
      'Prohibido fumar en el área'
    ],
    highlights: [
      'Más de 8 grupos musicales',
      'Música folclórica auténtica',
      'Venta de artesanías',
      'Fuegos artificiales al final'
    ],
    isRecurring: true,
    recurringPattern: 'Anual',
    order: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedEventsData() {
  try {
    // Verificar si ya existen eventos
    const eventsRef = db.collection('events');
    const snapshot = await eventsRef.get();
    
    if (!snapshot.empty) {
      console.log('⚠️ Ya existen eventos en Firebase');
      console.log(`📊 Total de eventos existentes: ${snapshot.size}`);
      
      // Mostrar eventos existentes
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.title} (${data.date}) - ${data.currentParticipants}/${data.maxParticipants} participantes`);
      });
      
      console.log('🔄 Actualizando eventos existentes...');
      
      // Eliminar eventos existentes
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`🗑️ Eliminados ${snapshot.size} eventos existentes`);
    }
    
    console.log('📝 Agregando nuevos eventos...');
    
    // Agregar nuevos eventos
    const batch = db.batch();
    eventsData.forEach(event => {
      const docRef = eventsRef.doc();
      batch.set(docRef, event);
    });
    
    await batch.commit();
    
    console.log('✅ Eventos poblados exitosamente en Firebase!');
    console.log(`📊 Total de eventos: ${eventsData.length}`);
    
    // Verificación
    const verifySnapshot = await eventsRef.get();
    console.log('🔍 Verificación:');
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.title} (ID: ${doc.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error al poblar eventos:', error);
  }
}

seedEventsData();

