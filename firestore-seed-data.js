// Script para poblar Firestore con datos de ejemplo
// Ejecutar en Firebase Console > Firestore > Data

// Colección: places
const places = [
  {
    id: '1',
    name: 'Parque Central',
    description: 'Hermoso parque con áreas verdes, juegos infantiles y pista de caminata.',
    category: 'recreacion',
    address: 'Calle Principal #123',
    hours: '6:00 AM - 10:00 PM',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    coordinates: { lat: 19.4326, lng: -99.1332 }
  },
  {
    id: '2',
    name: 'Cancha de Fútbol',
    description: 'Cancha de fútbol 7 con césped sintético y iluminación nocturna.',
    category: 'deportes',
    address: 'Avenida Deportiva #456',
    hours: '5:00 AM - 11:00 PM',
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    coordinates: { lat: 19.4336, lng: -99.1342 }
  }
];

// Colección: services
const services = [
  {
    id: '1',
    name: 'Restaurante El Buen Sabor',
    description: 'Comida tradicional mexicana con ingredientes frescos y ambiente familiar.',
    category: 'restaurantes',
    address: 'Calle Principal #123',
    phone: '+1 (555) 123-4567',
    website: 'www.elbuensabor.com',
    hours: '7:00 AM - 10:00 PM',
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    coordinates: { lat: 19.4306, lng: -99.1312 }
  }
];

// Colección: cameras
const cameras = [
  {
    id: '1',
    name: 'Entrada Principal',
    location: 'Puerta de entrada a la comunidad',
    status: 'online',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    lastUpdate: 'Hace 2 minutos'
  }
];

console.log('Datos de ejemplo para Firestore:');
console.log('Places:', places);
console.log('Services:', services);
console.log('Cameras:', cameras);




















