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
  subtitle: 'Descubre la rica historia, el crecimiento y las tradiciones que han dado forma a nuestra comunidad en Concepción de San Rafael de Heredia.',
  periods: [
    {
      period: 'Orígenes (1940-1960)',
      title: 'De Finca a Comunidad',
      description:
        'La zona donde hoy se encuentra Calle Jerusalén formaba parte de antiguas fincas cafetaleras y agrícolas que abastecían a Heredia y San José. A mediados del siglo XX, las familias comenzaron a establecerse de forma permanente, atraídas por el clima fresco, la fertilidad del suelo y la tranquilidad del lugar.',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      highlights: [
        'División de terrenos de fincas cafetaleras',
        'Llegada de familias fundadoras',
        'Inicio de caminos rurales de acceso'
      ],
      order: 1
    },
    {
      period: 'Consolidación (1960-1980)',
      title: 'Nace la Comunidad de Calle Jerusalén',
      description:
        'Durante estas décadas, el crecimiento de Concepción impulsó la creación de nuevos barrios, entre ellos Calle Jerusalén. Se construyeron las primeras viviendas formales, se organizó la comunidad y se mejoraron los caminos, conectando con el centro de Concepción y San Rafael. Los vecinos fundaron los primeros comités comunales y se fortaleció la vida social y religiosa.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      highlights: [
        'Organización del primer comité comunal',
        'Construcción de la primera escuela cercana',
        'Apertura de la primera pulpería local'
      ],
      order: 2
    },
    {
      period: 'Modernización (1980-2000)',
      title: 'Avances y Servicios Básicos',
      description:
        'El progreso llegó con la pavimentación de calles, el acceso a electricidad, agua potable y telefonía. Se mejoró la conexión con el centro de San Rafael, y la comunidad comenzó a diversificarse con pequeños comercios y servicios. Esta etapa marcó el paso de una zona rural a una comunidad moderna con identidad propia.',
      image: 'https://images.unsplash.com/photo-1489599856878-46f6b2b5c6e9?w=400',
      highlights: [
        'Pavimentación de la calle principal',
        'Conexión al sistema eléctrico nacional',
        'Ampliación de la red de agua comunal'
      ],
      order: 3
    },
    {
      period: 'Actualidad (2000-Presente)',
      title: 'Tradición y Desarrollo',
      description:
        'Hoy, Calle Jerusalén es un punto residencial y cultural en crecimiento dentro de Concepción de San Rafael. La comunidad conserva su espíritu solidario y su amor por las costumbres heredianas, combinando la tranquilidad del pasado con el desarrollo moderno. Se promueven iniciativas de turismo rural, actividades culturales y sostenibilidad ambiental.',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      highlights: [
        'Expansión residencial y turística',
        'Proyectos de embellecimiento urbano',
        'Actividades culturales y ecológicas'
      ],
      order: 4
    }
  ],
  traditions: [
    {
      title: 'Fiesta de San Rafael Arcángel',
      description:
        'Celebración tradicional en honor al santo patrono del cantón, San Rafael Arcángel. Se realizan procesiones, misas y ferias gastronómicas, con participación de todas las comunidades, incluida Calle Jerusalén.',
      icon: 'Flag',
      month: 'Octubre',
      category: 'Religiosa',
      importance: 'Alta',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
      practices: [
        'Procesión principal desde la iglesia central',
        'Misa y bendición comunal',
        'Feria de comidas típicas',
        'Presentaciones folclóricas',
        'Venta de productos locales'
      ],
      order: 1,
      isActive: true
    },
    {
      title: 'Feria del Café Herediano',
      description:
        'Evento que resalta la herencia cafetalera de la región. Productores locales muestran el proceso de tostado, molienda y degustación del café, un símbolo de la identidad de San Rafael y Concepción.',
      icon: 'Coffee',
      month: 'Marzo',
      category: 'Cultural',
      importance: 'Alta',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      practices: [
        'Degustaciones de café local',
        'Charlas sobre historia cafetalera',
        'Talleres de barismo',
        'Exposición de productos artesanales',
        'Música en vivo'
      ],
      order: 2,
      isActive: true
    },
    {
      title: 'Noche de Historias y Leyendas',
      description:
        'Tradición oral que reúne a los vecinos para compartir relatos, anécdotas y leyendas locales heredadas de los abuelos, manteniendo viva la memoria comunal.',
      icon: 'BookOpen',
      month: 'Agosto',
      category: 'Cultural',
      importance: 'Media',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      practices: [
        'Encuentros nocturnos en el salón comunal',
        'Narración de historias antiguas',
        'Música y tamales tradicionales',
        'Participación de niños y adultos',
        'Premio al mejor narrador'
      ],
      order: 3,
      isActive: true
    },
    {
      title: 'Día del Agricultor Herediano',
      description:
        'Celebración en reconocimiento a los agricultores locales, con ferias de productos frescos y actividades culturales.',
      icon: 'TreePine',
      month: 'Mayo',
      category: 'Agrícola',
      importance: 'Media',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      practices: [
        'Feria de productos agrícolas',
        'Bendición de cosechas',
        'Demostraciones de cultivo tradicional',
        'Exposición de herramientas antiguas',
        'Reconocimiento a familias fundadoras'
      ],
      order: 4,
      isActive: true
    }
  ],
  places: [
    {
      name: 'Casa de los Fundadores',
      description:
        'Antigua vivienda de una de las familias que colonizó Calle Jerusalén en los años 50. Hoy funciona como pequeño museo comunitario donde se conservan fotografías y objetos de los primeros pobladores.',
      year: '1953',
      significance: 'Patrimonio Histórico',
      category: 'Arquitectura',
      location: 'Calle Principal #1',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      features: [
        'Arquitectura herediana tradicional',
        'Museo comunitario abierto al público',
        'Colección de fotografías antiguas',
        'Visitas guiadas',
        'Patio central con jardín'
      ],
      order: 1,
      isActive: true
    },
    {
      name: 'Pulpería El Progreso',
      description:
        'Comercio histórico fundado por la familia Hernández en 1955. Fue uno de los primeros puntos de encuentro de la comunidad, ofreciendo víveres y noticias locales.',
      year: '1955',
      significance: 'Comercio Tradicional',
      category: 'Comercio',
      location: 'Calle Central #15',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      features: [
        'Atención familiar tradicional',
        'Venta de productos locales',
        'Reunión de vecinos y tertulias',
        'Decoración original preservada',
        'Lugar emblemático'
      ],
      order: 2,
      isActive: true
    },
    {
      name: 'Mirador de la Cruz',
      description:
        'Punto natural ubicado en las colinas cercanas a Concepción, desde donde se observan los valles de Heredia y Alajuela. Es considerado un lugar de reflexión y peregrinación local.',
      year: 'Natural',
      significance: 'Lugar Sagrado',
      category: 'Natural',
      location: 'Cerro de la Cruz',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      features: [
        'Vista panorámica del Valle Central',
        'Cruz de madera simbólica',
        'Sendero rural de acceso',
        'Punto de oración y descanso',
        'Área verde protegida'
      ],
      order: 3,
      isActive: true
    },
    {
      name: 'Escuela de Concepción',
      description:
        'Fundada en la década de 1960, ha sido pilar educativo para generaciones de niños de Calle Jerusalén y comunidades vecinas.',
      year: '1964',
      significance: 'Educación Comunitaria',
      category: 'Educación',
      location: 'Calle de la Educación #5',
      image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800',
      features: [
        'Amplio patio de recreo',
        'Biblioteca comunal',
        'Eventos cívicos y culturales',
        'Clases de música y arte',
        'Símbolo de unión comunitaria'
      ],
      order: 4,
      isActive: true
    }
  ],
  gallery: [
    {
      url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      caption: 'Primeras casas construidas sobre antiguos cafetales',
      order: 1
    },
    {
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      caption: 'Vecinos construyendo la escuela comunitaria',
      order: 2
    },
    {
      url: 'https://images.unsplash.com/photo-1489599856878-46f6b2b5c6e9?w=400',
      caption: 'Modernización de las calles y llegada de electricidad',
      order: 3
    },
    {
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      caption: 'Calle Jerusalén en la actualidad',
      order: 4
    },
    {
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
      caption: 'Celebración del Día de San Rafael Arcángel',
      order: 5
    },
    {
      url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      caption: 'Feria del Café y productos locales',
      order: 6
    }
  ],
  exploreLinks: [
    {
      title: 'Lugares de Interés',
      description: 'Descubre los sitios más emblemáticos de la comunidad',
      url: '/visitantes/lugares',
      icon: 'MapPin',
      color: 'bg-blue-50 hover:bg-blue-100',
      order: 1
    },
    {
      title: 'Eventos y Tradiciones',
      description: 'Participa en nuestras celebraciones culturales y religiosas',
      url: '/visitantes/eventos',
      icon: 'Calendar',
      color: 'bg-green-50 hover:bg-green-100',
      order: 2
    },
    {
      title: 'Contacto Comunitario',
      description: 'Conéctate con la organización local y el comité comunal',
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
