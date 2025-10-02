const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

console.log('🌱 Iniciando poblamiento completo de eventos y actividades...');

// Configuración de Firebase Admin
const serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore(app);

// Datos completos de eventos y actividades
const eventsData = [
  // Eventos Culturales
  {
    title: 'Festival de Música Folclórica',
    description: 'Celebración anual de la música tradicional con presentaciones de grupos locales y regionales. Una noche llena de cultura y tradición.',
    date: '2024-12-28',
    time: '18:00',
    location: 'Plaza Principal de Calle Jerusalén',
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
    order: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Eventos Deportivos
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
    order: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Carrera de la Amistad',
    description: 'Carrera recreativa de 5K que promueve la salud y la unión comunitaria. Incluye categorías para todas las edades.',
    date: '2024-12-22',
    time: '07:00',
    location: 'Circuito de Calle Jerusalén',
    category: 'Deportivo',
    type: 'Carrera',
    organizer: 'Club de Corredores Comunitarios',
    contact: '+1 (555) 456-7890',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    maxParticipants: 150,
    currentParticipants: 0,
    requirements: [
      'Inscripción gratuita',
      'Certificado médico básico',
      'Ropa deportiva cómoda',
      'Hidratación personal'
    ],
    highlights: [
      'Medallas para todos los participantes',
      'Categorías por edad y género',
      'Hidratación en el recorrido',
      'Desayuno comunitario al final'
    ],
    isRecurring: true,
    recurringPattern: 'Semestral',
    order: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Eventos Educativos
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
    order: 6,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Curso de Artesanía en Barro',
    description: 'Taller práctico donde aprenderás las técnicas tradicionales de alfarería y cerámica de la región.',
    date: '2024-12-29',
    time: '10:00',
    location: 'Taller de Artesanías',
    category: 'Educativo',
    type: 'Taller',
    organizer: 'Maestros Artesanos de Calle Jerusalén',
    contact: '+1 (555) 567-8901',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    maxParticipants: 20,
    currentParticipants: 0,
    requirements: [
      'Inscripción previa requerida',
      'Ropa que se pueda ensuciar',
      'Cuota de materiales: $20',
      'Edad mínima: 8 años'
    ],
    highlights: [
      'Técnicas ancestrales de alfarería',
      'Materiales naturales incluidos',
      'Llevar a casa tus creaciones',
      'Certificado de participación'
    ],
    isRecurring: true,
    recurringPattern: 'Mensual',
    order: 7,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Eventos Religiosos
  {
    title: 'Procesión de San Jerónimo',
    description: 'Procesión religiosa en honor al santo patrono de la comunidad, con participación de toda la población.',
    date: '2024-12-30',
    time: '16:00',
    location: 'Iglesia de San Jerónimo',
    category: 'Religioso',
    type: 'Procesión',
    organizer: 'Parroquia de San Jerónimo',
    contact: '+1 (555) 678-9012',
    image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
    maxParticipants: 500,
    currentParticipants: 0,
    requirements: [
      'Participación libre',
      'Respeto por la solemnidad del acto',
      'Vestimenta apropiada',
      'No se permite alcohol'
    ],
    highlights: [
      'Imagen del santo patrono',
      'Música religiosa tradicional',
      'Bendición de la comunidad',
      'Refrigerios después de la procesión'
    ],
    isRecurring: true,
    recurringPattern: 'Anual',
    order: 8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Misa de Navidad Comunitaria',
    description: 'Celebración especial de Navidad que reúne a toda la comunidad en una misa de medianoche llena de tradición.',
    date: '2024-12-24',
    time: '24:00',
    location: 'Iglesia de San Jerónimo',
    category: 'Religioso',
    type: 'Misa',
    organizer: 'Parroquia de San Jerónimo',
    contact: '+1 (555) 678-9012',
    image: 'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=800',
    maxParticipants: 400,
    currentParticipants: 0,
    requirements: [
      'Participación libre',
      'Llegar con anticipación',
      'Vestimenta elegante',
      'Respeto por la solemnidad'
    ],
    highlights: [
      'Misa de medianoche tradicional',
      'Coro comunitario',
      'Belén viviente',
      'Intercambio de regalos después'
    ],
    isRecurring: true,
    recurringPattern: 'Anual',
    order: 9,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Eventos de Servicio Comunitario
  {
    title: 'Jornada de Limpieza Comunitaria',
    description: 'Actividad de voluntariado para mantener limpia y hermosa nuestra comunidad. Incluye limpieza de calles, parques y áreas comunes.',
    date: '2024-12-14',
    time: '08:00',
    location: 'Punto de encuentro: Plaza Principal',
    category: 'Servicio Comunitario',
    type: 'Voluntariado',
    organizer: 'Comité de Medio Ambiente',
    contact: '+1 (555) 789-0123',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800',
    maxParticipants: 100,
    currentParticipants: 0,
    requirements: [
      'Inscripción previa recomendada',
      'Traer guantes y ropa cómoda',
      'Herramientas básicas de limpieza',
      'Botella de agua personal'
    ],
    highlights: [
      'Materiales de limpieza proporcionados',
      'Refrigerios para voluntarios',
      'Certificado de participación',
      'Impacto positivo en la comunidad'
    ],
    isRecurring: true,
    recurringPattern: 'Trimestral',
    order: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Campaña de Donación de Sangre',
    description: 'Campaña de donación de sangre en colaboración con el banco de sangre local para ayudar a salvar vidas.',
    date: '2024-12-20',
    time: '09:00',
    location: 'Centro de Salud Comunitario',
    category: 'Servicio Comunitario',
    type: 'Campaña',
    organizer: 'Centro de Salud Comunitario',
    contact: '+1 (555) 890-1234',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
    maxParticipants: 50,
    currentParticipants: 0,
    requirements: [
      'Cita previa requerida',
      'Documento de identidad',
      'Ayuno de 8 horas',
      'Peso mínimo: 50 kg'
    ],
    highlights: [
      'Examen médico gratuito',
      'Refrigerio después de la donación',
      'Certificado de donación',
      'Ayuda a salvar vidas'
    ],
    isRecurring: true,
    recurringPattern: 'Bimensual',
    order: 11,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Eventos de Entretenimiento
  {
    title: 'Noche de Cine al Aire Libre',
    description: 'Proyección de películas clásicas y familiares en la plaza principal. Una experiencia única bajo las estrellas.',
    date: '2024-12-21',
    time: '19:30',
    location: 'Plaza Principal',
    category: 'Entretenimiento',
    type: 'Cine',
    organizer: 'Comité de Entretenimiento',
    contact: '+1 (555) 901-2345',
    image: 'https://images.unsplash.com/photo-1489599804151-0b0b5b5b5b5b?w=800',
    maxParticipants: 200,
    currentParticipants: 0,
    requirements: [
      'Entrada gratuita',
      'Traer silla plegable o manta',
      'Se permite comida y bebidas',
      'Llegar temprano para buen lugar'
    ],
    highlights: [
      'Proyección en pantalla gigante',
      'Sonido de alta calidad',
      'Palomitas de maíz gratuitas',
      'Ambiente familiar y acogedor'
    ],
    isRecurring: true,
    recurringPattern: 'Mensual',
    order: 12,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Concurso de Talentos Comunitario',
    description: 'Espacio para que los miembros de la comunidad muestren sus talentos artísticos: canto, baile, poesía, música y más.',
    date: '2024-12-27',
    time: '18:00',
    location: 'Centro Comunitario',
    category: 'Entretenimiento',
    type: 'Concurso',
    organizer: 'Comité de Cultura y Arte',
    contact: '+1 (555) 012-3456',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    maxParticipants: 30,
    currentParticipants: 0,
    requirements: [
      'Inscripción previa requerida',
      'Preparar presentación de 3-5 minutos',
      'Traer equipos necesarios',
      'Edad mínima: 5 años'
    ],
    highlights: [
      'Premios para los primeros lugares',
      'Jurado de artistas locales',
      'Categorías por edad',
      'Grabación profesional del evento'
    ],
    isRecurring: true,
    recurringPattern: 'Semestral',
    order: 13,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedEventsAndActivities() {
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
    
    console.log('📝 Agregando nuevos eventos y actividades...');
    
    // Agregar nuevos eventos
    const batch = db.batch();
    eventsData.forEach(event => {
      const docRef = eventsRef.doc();
      batch.set(docRef, event);
    });
    
    await batch.commit();
    
    console.log('✅ Eventos y actividades poblados exitosamente en Firebase!');
    console.log(`📊 Total de eventos: ${eventsData.length}`);
    
    // Estadísticas por categoría
    const categories = {};
    eventsData.forEach(event => {
      categories[event.category] = (categories[event.category] || 0) + 1;
    });
    
    console.log('📈 Estadísticas por categoría:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} eventos`);
    });
    
    // Verificación
    const verifySnapshot = await eventsRef.get();
    console.log('🔍 Verificación:');
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.title} (${data.category}) - ${data.date} ${data.time}`);
    });
    
  } catch (error) {
    console.error('❌ Error al poblar eventos y actividades:', error);
  }
}

seedEventsAndActivities();

