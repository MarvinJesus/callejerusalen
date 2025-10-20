const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

console.log('🌱 Iniciando poblamiento de datos de guía de visitantes...');

// Configuración de Firebase Admin
const serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore(app);

// Datos de ejemplo para la guía de visitantes
const guideData = {
  title: 'Guía para Visitantes',
  subtitle: 'Todo lo que necesitas saber para disfrutar al máximo tu visita a nuestra comunidad.',
  sections: [
    {
      id: '1',
      title: 'Bienvenida',
      icon: 'Heart',
      content: [
        '¡Bienvenido a Calle Jerusalén!',
        'Somos una comunidad unida que valora la seguridad, la convivencia y el bienestar de todos.',
        'Esta guía te ayudará a conocer mejor nuestra comunidad y aprovechar al máximo tu visita.',
        'Respetamos la diversidad y promovemos un ambiente de armonía y respeto mutuo.'
      ],
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Información General',
      icon: 'Info',
      content: [
        'Ubicación: Calle Jerusalén #123, Colonia Centro',
        'Horarios de atención: Lunes a Viernes 8:00 AM - 6:00 PM',
        'Área total: 15 hectáreas de desarrollo comunitario',
        'Población: 150+ familias residentes',
        'Fundada en 1985, nuestra comunidad tiene una rica historia'
      ],
      order: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Servicios Disponibles',
      icon: 'Users',
      content: [
        'Administración comunitaria con atención personalizada',
        'Servicios de seguridad 24/7',
        'Mantenimiento y limpieza de áreas comunes',
        'WiFi gratuito en áreas públicas',
        'Estacionamiento para visitantes',
        'Área de juegos para niños'
      ],
      order: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      title: 'Reglas y Normas',
      icon: 'Shield',
      content: [
        'Respeta el horario de silencio: 10:00 PM - 7:00 AM',
        'Mantén las áreas comunes limpias',
        'Estaciona solo en espacios designados',
        'Los menores deben estar acompañados por un adulto',
        'Está prohibido el consumo de alcohol en espacios públicos',
        'Respeta la propiedad privada y las áreas restringidas'
      ],
      order: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      title: 'Emergencias',
      icon: 'AlertTriangle',
      content: [
        'Seguridad: +1 (555) 911-0000',
        'Emergencias médicas: 911',
        'Administración: +1 (555) 911-0002',
        'Mantenimiento: +1 (555) 911-0001',
        'Todos los números están disponibles 24/7',
        'En caso de emergencia, dirígete al punto de seguridad más cercano'
      ],
      order: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  amenities: [
    {
      id: '1',
      name: 'WiFi Gratuito',
      description: 'Conexión a internet en todas las áreas comunes',
      icon: 'Wifi',
      available: true,
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Estacionamiento',
      description: 'Espacios designados para visitantes',
      icon: 'ParkingCircle',
      available: true,
      order: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Áreas de Descanso',
      description: 'Bancas y espacios sombreados',
      icon: 'Users',
      available: true,
      order: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: 'Baños Públicos',
      description: 'Instalaciones sanitarias en áreas comunes',
      icon: 'MapPin',
      available: true,
      order: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      name: 'Área de Juegos',
      description: 'Espacio recreativo para niños',
      icon: 'Users',
      available: true,
      order: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  tips: [
    {
      id: '1',
      title: 'Planifica tu visita',
      description: 'Revisa los horarios de los lugares que quieres visitar y consulta el clima',
      icon: 'Clock',
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Usa el mapa interactivo',
      description: 'Navega fácilmente por la comunidad con nuestra herramienta de mapas',
      icon: 'Navigation',
      order: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Consulta los eventos',
      description: 'Mantente al día con las actividades comunitarias y eventos especiales',
      icon: 'Calendar',
      order: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      title: 'Respeta las normas',
      description: 'Ayúdanos a mantener un ambiente agradable para todos los visitantes',
      icon: 'Shield',
      order: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      title: 'Conecta con la comunidad',
      description: 'Participa en las actividades y conoce a los residentes locales',
      icon: 'Users',
      order: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  emergencyContacts: [
    {
      id: '1',
      name: 'Seguridad',
      phone: '+1 (555) 911-0000',
      description: 'Servicio de seguridad 24/7',
      availableHours: '24/7',
      isEmergency: true,
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Administración',
      phone: '+1 (555) 911-0002',
      description: 'Oficina administrativa de la comunidad',
      availableHours: 'Lunes a Viernes 8:00 AM - 6:00 PM',
      isEmergency: false,
      order: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Mantenimiento',
      phone: '+1 (555) 911-0001',
      description: 'Servicios de mantenimiento y limpieza',
      availableHours: 'Lunes a Viernes 7:00 AM - 5:00 PM',
      isEmergency: false,
      order: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: 'Emergencias Médicas',
      phone: '911',
      description: 'Servicio de emergencias médicas',
      availableHours: '24/7',
      isEmergency: true,
      order: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

async function seedGuideData() {
  try {
    // Verificar si ya existen datos
    const guideRef = db.collection('visitorsGuide');
    const snapshot = await guideRef.get();
    
    if (!snapshot.empty) {
      console.log('⚠️ Ya existen datos de guía de visitantes en Firebase');
      console.log('📊 Datos actuales:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}`);
        console.log(`- Título: ${data.title}`);
        console.log(`- Secciones: ${data.sections?.length || 0}`);
        console.log(`- Comodidades: ${data.amenities?.length || 0}`);
        console.log(`- Consejos: ${data.tips?.length || 0}`);
        console.log(`- Contactos: ${data.emergencyContacts?.length || 0}`);
        console.log(`- Activo: ${data.isActive}`);
        console.log('---');
      });
      
      console.log('🔄 Actualizando datos existentes...');
      const existingDoc = snapshot.docs[0];
      await guideRef.doc(existingDoc.id).update({
        ...guideData,
        updatedAt: new Date()
      });
      console.log(`✅ Datos de guía de visitantes actualizados: ${existingDoc.id}`);
    } else {
      console.log('📝 Creando nuevos datos de guía de visitantes...');
      const docRef = await guideRef.add(guideData);
      console.log(`✅ Datos de guía de visitantes creados: ${docRef.id}`);
    }
    
    console.log('🎉 Poblamiento de datos de guía de visitantes completado exitosamente');
    console.log('📋 Resumen de datos:');
    console.log(`- Secciones de la guía: ${guideData.sections.length}`);
    console.log(`- Comodidades disponibles: ${guideData.amenities.length}`);
    console.log(`- Consejos útiles: ${guideData.tips.length}`);
    console.log(`- Contactos de emergencia: ${guideData.emergencyContacts.length}`);
    
  } catch (error) {
    console.error('❌ Error al poblar datos de guía de visitantes:', error);
  }
}

seedGuideData();
















