const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Configuración de Firebase Admin
const serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore(app);

// Datos de ejemplo para la historia
const historyData = {
  title: 'Historia de Calle Jerusalén',
  subtitle: 'Descubre la rica historia y tradiciones que han moldeado nuestra comunidad a lo largo de los años.',
  periods: [
    {
      period: 'Fundación (1950-1960)',
      title: 'Los Primeros Pobladores',
      description: 'Calle Jerusalén fue fundada por un grupo de familias que buscaban un lugar tranquilo para establecerse. Las primeras casas se construyeron con materiales locales y siguiendo las tradiciones arquitectónicas de la región.',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      highlights: [
        'Primeras 12 familias se establecen',
        'Construcción de la primera pulpería',
        'Creación del comité comunal'
      ],
      order: 1
    },
    {
      period: 'Crecimiento (1960-1980)',
      title: 'Expansión y Desarrollo',
      description: 'Durante estas décadas, la comunidad creció significativamente. Se construyeron las primeras escuelas, se establecieron más comercios y se formó la identidad cultural que caracteriza a Calle Jerusalén.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      highlights: [
        'Construcción de la escuela primaria',
        'Apertura de 5 nuevas pulperías',
        'Creación del festival anual'
      ],
      order: 2
    },
    {
      period: 'Modernización (1980-2000)',
      title: 'Entrada al Siglo XXI',
      description: 'La llegada de servicios básicos modernos transformó la vida en la comunidad. Se pavimentaron las calles principales, llegó la electricidad y se establecieron los servicios de salud.',
      image: 'https://images.unsplash.com/photo-1489599856878-46f6b2b5c6e9?w=400',
      highlights: [
        'Pavimentación de calles principales',
        'Instalación de red eléctrica',
        'Construcción del centro de salud'
      ],
      order: 3
    },
    {
      period: 'Actualidad (2000-Presente)',
      title: 'Comunidad Moderna',
      description: 'Hoy en día, Calle Jerusalén mantiene su esencia tradicional mientras abraza la modernidad. Es un ejemplo de desarrollo sostenible que preserva su patrimonio cultural.',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      highlights: [
        'Implementación de tecnología',
        'Turismo comunitario',
        'Preservación del patrimonio'
      ],
      order: 4
    }
  ],
  traditions: [
    {
      title: 'Fiesta de San Jerónimo',
      description: 'Celebración anual en honor al santo patrono de la comunidad, con procesiones, música tradicional y comida típica.',
      icon: 'Flag',
      month: 'Septiembre',
      category: 'Religiosa',
      importance: 'Alta',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
      practices: [
        'Procesión por las calles principales',
        'Misa comunitaria en la iglesia',
        'Feria de comida tradicional',
        'Juegos y actividades para niños',
        'Bailes folclóricos'
      ],
      order: 1,
      isActive: true
    },
    {
      title: 'Feria Artesanal',
      description: 'Exposición de artesanías locales, productos agrícolas y comida tradicional de la región.',
      icon: 'Star',
      month: 'Marzo',
      category: 'Cultural',
      importance: 'Media',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      practices: [
        'Exposición de artesanías',
        'Venta de productos locales',
        'Talleres de artesanía',
        'Degustación de comida tradicional',
        'Presentaciones culturales'
      ],
      order: 2,
      isActive: true
    },
    {
      title: 'Noche de Cuentos',
      description: 'Tradición oral donde los ancianos comparten historias y leyendas de la comunidad.',
      icon: 'BookOpen',
      month: 'Todo el año',
      category: 'Cultural',
      importance: 'Media',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      practices: [
        'Reuniones mensuales en el centro comunitario',
        'Participación de todas las edades',
        'Transmisión oral de historias',
        'Refrigerios tradicionales',
        'Intercambio de experiencias'
      ],
      order: 3,
      isActive: true
    },
    {
      title: 'Día del Maíz',
      description: 'Celebración de la cosecha con platillos tradicionales y ceremonias de agradecimiento.',
      icon: 'TreePine',
      month: 'Noviembre',
      category: 'Agrícola',
      importance: 'Media',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      practices: [
        'Bendición de la cosecha',
        'Preparación de platillos tradicionales',
        'Exposición de productos agrícolas',
        'Talleres de cocina tradicional',
        'Ceremonia de agradecimiento a la tierra'
      ],
      order: 4,
      isActive: true
    }
  ],
  places: [
    {
      name: 'Casa de los Fundadores',
      description: 'La primera casa construida en Calle Jerusalén, ahora convertida en museo comunitario.',
      year: '1952',
      significance: 'Patrimonio Histórico',
      category: 'Arquitectura',
      location: 'Calle Principal #1',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      features: [
        'Arquitectura colonial auténtica',
        'Museo comunitario',
        'Exposición de objetos históricos',
        'Visitas guiadas disponibles',
        'Patio central tradicional'
      ],
      order: 1,
      isActive: true
    },
    {
      name: 'Pulpería El Progreso',
      description: 'La pulpería más antigua de la comunidad, en funcionamiento desde 1955.',
      year: '1955',
      significance: 'Comercio Tradicional',
      category: 'Comercio',
      location: 'Calle Central #15',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      features: [
        'Productos locales frescos',
        'Atención personalizada',
        'Historia familiar preservada',
        'Productos artesanales',
        'Punto de encuentro comunitario'
      ],
      order: 2,
      isActive: true
    },
    {
      name: 'Mirador de la Cruz',
      description: 'Punto de observación natural que ofrece vistas panorámicas de toda la región.',
      year: 'Natural',
      significance: 'Lugar Sagrado',
      category: 'Natural',
      location: 'Cerro de la Cruz',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      features: [
        'Vista panorámica de 360°',
        'Cruz de madera centenaria',
        'Sendero de acceso',
        'Área de descanso',
        'Lugar de peregrinación'
      ],
      order: 3,
      isActive: true
    },
    {
      name: 'Escuela Central',
      description: 'Primera escuela de la comunidad, construida con el esfuerzo de todos los vecinos.',
      year: '1965',
      significance: 'Educación Comunitaria',
      category: 'Educación',
      location: 'Calle de la Educación #5',
      image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800',
      features: [
        'Arquitectura educativa tradicional',
        'Patio de recreo amplio',
        'Biblioteca comunitaria',
        'Aulas históricas preservadas',
        'Centro de reuniones comunitarias'
      ],
      order: 4,
      isActive: true
    }
  ],
  gallery: [
    {
      url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      caption: 'Primeras casas de la comunidad',
      order: 1
    },
    {
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      caption: 'Construcción de la escuela primaria',
      order: 2
    },
    {
      url: 'https://images.unsplash.com/photo-1489599856878-46f6b2b5c6e9?w=400',
      caption: 'Pavimentación de calles principales',
      order: 3
    },
    {
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      caption: 'Comunidad moderna',
      order: 4
    },
    {
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
      caption: 'Fiesta de San Jerónimo',
      order: 5
    },
    {
      url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      caption: 'Feria artesanal anual',
      order: 6
    }
  ],
  exploreLinks: [
    {
      title: 'Lugares de Interés',
      description: 'Descubre los sitios más importantes de la comunidad',
      url: '/visitantes/lugares',
      icon: 'MapPin',
      color: 'bg-blue-50 hover:bg-blue-100',
      order: 1
    },
    {
      title: 'Eventos Culturales',
      description: 'Participa en nuestras celebraciones tradicionales',
      url: '/visitantes/eventos',
      icon: 'Calendar',
      color: 'bg-green-50 hover:bg-green-100',
      order: 2
    },
    {
      title: 'Contacto',
      description: 'Conéctate con nuestra comunidad',
      url: '/visitantes/contacto',
      icon: 'Users',
      color: 'bg-purple-50 hover:bg-purple-100',
      order: 3
    }
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

async function seedHistory() {
  try {
    console.log('🌱 Iniciando poblamiento de datos de historia...');
    
    // Verificar si ya existen datos
    const historyRef = db.collection('history');
    const snapshot = await historyRef.get();
    
    if (!snapshot.empty) {
      console.log('⚠️ Ya existen datos de historia en Firebase');
      console.log('📊 Datos actuales:');
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}`);
        console.log(`- Título: ${data.title}`);
        console.log(`- Períodos: ${data.periods?.length || 0}`);
        console.log(`- Tradiciones: ${data.traditions?.length || 0}`);
        console.log(`- Lugares: ${data.places?.length || 0}`);
        console.log(`- Galería: ${data.gallery?.length || 0}`);
        console.log(`- Enlaces: ${data.exploreLinks?.length || 0}`);
        console.log(`- Activo: ${data.isActive}`);
        console.log('---');
      });
      
      console.log('🔄 Actualizando datos existentes...');
      const existingDoc = snapshot.docs[0];
      await existingDoc.ref.update({
        ...historyData,
        updatedAt: new Date()
      });
      console.log(`✅ Datos de historia actualizados: ${existingDoc.id}`);
    } else {
      console.log('📝 Creando nuevos datos de historia...');
      const docRef = await historyRef.add(historyData);
      console.log(`✅ Datos de historia creados con ID: ${docRef.id}`);
    }
    
    console.log('🎉 Poblamiento de datos de historia completado exitosamente');
    console.log('📋 Resumen de datos:');
    console.log(`- Períodos históricos: ${historyData.periods.length}`);
    console.log(`- Tradiciones culturales: ${historyData.traditions.length}`);
    console.log(`- Lugares históricos: ${historyData.places.length}`);
    console.log(`- Imágenes de galería: ${historyData.gallery.length}`);
    console.log(`- Enlaces de exploración: ${historyData.exploreLinks.length}`);
    
  } catch (error) {
    console.error('❌ Error al poblar datos de historia:', error);
  } finally {
    process.exit(0);
  }
}

seedHistory();
