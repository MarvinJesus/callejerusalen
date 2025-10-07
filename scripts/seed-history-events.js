const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

console.log('🌱 Iniciando poblamiento de eventos en el documento de historia...');

// Configuración de Firebase Admin
const serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore(app);

// Datos de eventos para agregar al documento de historia
const eventsData = [
  {
    title: 'Fiesta Patronal de San Rafael Arcángel',
    description:
      'La celebración más importante del cantón, en honor al santo patrono. Incluye procesiones, misas, música folclórica, comidas típicas y actividades para toda la familia. Calle Jerusalén participa con decoraciones y eventos locales.',
    date: '2025-10-24',
    time: '08:00',
    location: 'Iglesia y Plaza Central de San Rafael de Heredia',
    category: 'Religiosa',
    type: 'Celebración',
    organizer: 'Comité Parroquial y Comunidad de Calle Jerusalén',
    contact: '+506 2267-1234',
    image: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800',
    maxParticipants: 500,
    currentParticipants: 0,
    requirements: [
      'Entrada libre',
      'Vestimenta respetuosa',
      'Prohibido el consumo de alcohol en el perímetro'
    ],
    highlights: [
      'Procesión principal con imágenes religiosas',
      'Bendición comunal',
      'Feria de comidas típicas',
      'Música folclórica y bailes tradicionales'
    ],
    isRecurring: true,
    recurringPattern: 'Anual',
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Festival del Café Herediano',
    description:
      'Evento anual que celebra la herencia cafetalera de San Rafael y sus comunidades. Productores locales ofrecen degustaciones y talleres sobre cultivo y tostado del café. Calle Jerusalén participa con puestos de repostería y artesanías.',
    date: '2025-11-10',
    time: '09:00',
    location: 'Parque Central de San Rafael de Heredia',
    category: 'Cultural',
    type: 'Feria',
    organizer: 'Asociación de Productores de Café de San Rafael',
    contact: '+506 2268-4520',
    image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9d2d4?w=800',
    maxParticipants: 300,
    currentParticipants: 0,
    requirements: [
      'Entrada gratuita',
      'Traer taza reutilizable',
      'Se recomienda calzado cómodo'
    ],
    highlights: [
      'Degustaciones de café artesanal',
      'Exposición de tostadores locales',
      'Charlas sobre historia cafetalera',
      'Presentaciones artísticas en vivo'
    ],
    isRecurring: true,
    recurringPattern: 'Anual',
    order: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Noche de Cuentos y Leyendas',
    description:
      'Una noche mágica donde los mayores de la comunidad comparten relatos de antaño: apariciones, historias de fincas antiguas y anécdotas que forman parte de la identidad de Concepción y Calle Jerusalén.',
    date: '2025-12-07',
    time: '19:00',
    location: 'Centro Comunitario de Calle Jerusalén',
    category: 'Cultural',
    type: 'Entretenimiento',
    organizer: 'Comité Cultural de Calle Jerusalén',
    contact: '+506 7012-4589',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    maxParticipants: 100,
    currentParticipants: 0,
    requirements: [
      'Entrada gratuita',
      'Traer silla o manta para sentarse',
      'Se recomienda abrigo por el clima fresco'
    ],
    highlights: [
      'Historias contadas por los abuelos',
      'Leyendas heredianas tradicionales',
      'Música acústica local',
      'Café y pan casero gratuitos'
    ],
    isRecurring: true,
    recurringPattern: 'Mensual (último sábado)',
    order: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Torneo Deportivo Interbarrios',
    description:
      'Competencia deportiva que une a los diferentes barrios de Concepción. Calle Jerusalén participa con su equipo local en fútbol y voleibol, promoviendo la sana convivencia y el deporte comunitario.',
    date: '2025-12-15',
    time: '08:00',
    location: 'Cancha Deportiva Municipal de Concepción',
    category: 'Deportivo',
    type: 'Competencia',
    organizer: 'Comité Deportivo de Concepción',
    contact: '+506 6045-3399',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    maxParticipants: 150,
    currentParticipants: 0,
    requirements: [
      'Inscripción previa gratuita',
      'Equipo deportivo completo',
      'Certificado médico recomendado'
    ],
    highlights: [
      'Categorías infantil, juvenil y adulto',
      'Entrega de medallas y trofeos',
      'Stand de comidas típicas',
      'Música y animación'
    ],
    isRecurring: true,
    recurringPattern: 'Anual',
    order: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Taller de Cocina Típica Costarricense',
    description:
      'Aprende a preparar platos tradicionales como tamales, picadillos y empanadas. Las cocineras locales de Calle Jerusalén enseñan recetas que forman parte del patrimonio gastronómico herediano.',
    date: '2025-12-22',
    time: '14:00',
    location: 'Cocina Comunitaria de Calle Jerusalén',
    category: 'Educativo',
    type: 'Taller',
    organizer: 'Grupo de Mujeres Emprendedoras de Calle Jerusalén',
    contact: '+506 6004-8877',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    maxParticipants: 25,
    currentParticipants: 0,
    requirements: [
      'Inscripción previa requerida',
      'Traer delantal y recipiente para llevar',
      'Cuota de materiales: ₡5.000',
      'Edad mínima: 12 años'
    ],
    highlights: [
      'Recetas tradicionales de la región',
      'Uso de ingredientes locales frescos',
      'Degustación al final del taller',
      'Recetario impreso incluido'
    ],
    isRecurring: true,
    recurringPattern: 'Trimestral',
    order: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedHistoryEvents() {
  try {
    // Obtener el documento de historia existente
    const historyRef = db.collection('history');
    const snapshot = await historyRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No se encontró documento de historia');
      return;
    }
    
    const doc = snapshot.docs[0];
    const historyData = doc.data();
    
    console.log('📋 Documento de historia encontrado:', historyData.title);
    console.log(`📊 Eventos actuales: ${historyData.events?.length || 0}`);
    
    // Eliminar todos los eventos existentes
    console.log('🗑️ Eliminando todos los eventos existentes...');
    await doc.ref.update({
      events: [],
      updatedAt: new Date()
    });
    console.log('✅ Eventos eliminados exitosamente!');
    
    // Agregar los nuevos eventos al documento de historia
    await doc.ref.update({
      events: eventsData,
      updatedAt: new Date()
    });
    
    console.log('✅ Eventos agregados exitosamente al documento de historia!');
    console.log(`📊 Total de eventos ahora: ${eventsData.length}`);
    
    // Mostrar los eventos agregados
    console.log('🎉 Eventos agregados:');
    eventsData.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} (${event.date} ${event.time})`);
    });
    
  } catch (error) {
    console.error('❌ Error al poblar eventos en historia:', error);
  }
}

seedHistoryEvents();
