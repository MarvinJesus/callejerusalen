#!/usr/bin/env node

/**
 * Script para inicializar información de emergencia con coordenadas correctas
 * de Calle Jerusalén, Heredia, Costa Rica
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Verificar si el archivo de credenciales existe
const credentialsPath = path.join(__dirname, '..', 'callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

if (!fs.existsSync(credentialsPath)) {
  console.error('❌ Error: No se encontró el archivo de credenciales de Firebase Admin SDK');
  console.error('   Buscando en:', credentialsPath);
  process.exit(1);
}

try {
  // Inicializar Firebase Admin
  const serviceAccount = require(credentialsPath);
  
  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  const db = getFirestore(app);

  async function seedEmergencyInfo() {
    console.log('🚀 Iniciando seed de información de emergencia...');

    try {
      // Verificar si ya existe información de emergencia
      const emergencyRef = db.collection('emergencyInfo');
      const snapshot = await emergencyRef.get();

      if (!snapshot.empty) {
        console.log('⚠️  Ya existe información de emergencia en la base de datos');
        
        // Mostrar información existente
        const existingDoc = snapshot.docs[0];
        const existingData = existingDoc.data();
        console.log('📋 Información existente:');
        console.log('   - Título:', existingData.title);
        console.log('   - Área segura:', existingData.safeAreaName);
        console.log('   - Coordenadas:', existingData.map?.lat, existingData.map?.lng);
        console.log('   - Activo:', existingData.isActive);
        
        // Verificar si las coordenadas son correctas
        const hasCorrectCoords = existingData.map?.lat === 10.02424263 && 
                                existingData.map?.lng === -84.07890636;
        
        if (!hasCorrectCoords) {
          console.log('🔄 Actualizando coordenadas a Calle Jerusalén...');
          await emergencyRef.doc(existingDoc.id).update({
            map: {
              lat: 10.02424263,
              lng: -84.07890636,
              zoom: 16
            },
            updatedAt: new Date()
          });
          console.log('✅ Coordenadas actualizadas correctamente');
        } else {
          console.log('✅ Las coordenadas ya son correctas');
        }
        
        return;
      }

      // Crear nueva información de emergencia
      const emergencyData = {
        title: 'Área Segura de Reunión',
        subtitle: 'Punto de reunión en caso de siniestro o catástrofe',
        description: 'En caso de siniestro o catástrofe, dirígete de inmediato al área segura designada y sigue las indicaciones de la comunidad y las autoridades. Este punto de encuentro está ubicado en un lugar seguro y accesible para todos los residentes.',
        safeAreaName: 'Parque Central de Calle Jerusalén',
        safeAreaAddress: 'Calle Jerusalén, Heredia, Costa Rica',
        imageUrl: '',
        tips: [
          'Mantén la calma y ayuda a quienes lo necesiten',
          'No bloquees vías de acceso para equipos de emergencia',
          'Lleva documentos de identidad y un botiquín básico si es posible',
          'Mantente informado a través de los canales oficiales de la comunidad',
          'Ayuda a personas con movilidad reducida a llegar al área segura'
        ],
        instructions: [
          'Sigue las rutas señalizadas hacia el punto de encuentro',
          'Evita regresar a zonas de riesgo hasta recibir autorización',
          'Reporta personas desaparecidas a los coordinadores de seguridad',
          'Mantén la distancia social y sigue los protocolos de seguridad',
          'Espera instrucciones de las autoridades competentes'
        ],
        map: {
          lat: 10.02424263,
          lng: -84.07890636,
          zoom: 16
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await emergencyRef.add(emergencyData);
      console.log('✅ Información de emergencia creada exitosamente');
      console.log('   - ID del documento:', docRef.id);
      console.log('   - Título:', emergencyData.title);
      console.log('   - Área segura:', emergencyData.safeAreaName);
      console.log('   - Coordenadas:', emergencyData.map.lat, emergencyData.map.lng);
      console.log('   - Activo:', emergencyData.isActive);

    } catch (error) {
      console.error('❌ Error al crear información de emergencia:', error);
      throw error;
    }
  }

  // Ejecutar el seed
  seedEmergencyInfo()
    .then(() => {
      console.log('🎉 Seed de información de emergencia completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error durante el seed:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin:', error);
  process.exit(1);
}
