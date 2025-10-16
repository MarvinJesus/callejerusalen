#!/usr/bin/env node

/**
 * Script para desplegar los índices de Firestore
 * 
 * Este script despliega los índices definidos en firestore.indexes.json
 * a la base de datos de Firestore.
 * 
 * Uso:
 * node scripts/deploy-firestore-indexes.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Desplegando índices de Firestore...');

try {
  // Verificar que el archivo de índices existe
  const indexesFile = path.join(__dirname, '..', 'firestore.indexes.json');
  if (!fs.existsSync(indexesFile)) {
    throw new Error('Archivo firestore.indexes.json no encontrado');
  }

  // Verificar que Firebase CLI está instalado
  try {
    execSync('firebase --version', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('Firebase CLI no está instalado. Instálalo con: npm install -g firebase-tools');
  }

  // Verificar que estamos autenticados
  try {
    execSync('firebase projects:list', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('No estás autenticado con Firebase. Ejecuta: firebase login');
  }

  // Desplegar los índices
  console.log('📊 Desplegando índices de Firestore...');
  execSync('firebase deploy --only firestore:indexes', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ Índices de Firestore desplegados exitosamente');
  console.log('');
  console.log('📋 Índices creados:');
  console.log('  - eventRegistrations: eventId + registrationDate');
  console.log('  - eventRegistrations: userId + registrationDate');
  console.log('  - eventRegistrations: userId + status + registrationDate');
  console.log('');
  console.log('🎯 Ahora puedes usar las consultas optimizadas en el servicio de inscripciones');

} catch (error) {
  console.error('❌ Error al desplegar índices de Firestore:', error.message);
  console.log('');
  console.log('🔧 Soluciones posibles:');
  console.log('  1. Instalar Firebase CLI: npm install -g firebase-tools');
  console.log('  2. Autenticarse: firebase login');
  console.log('  3. Verificar que el proyecto esté configurado: firebase use --add');
  console.log('  4. Verificar que firestore.indexes.json existe');
  process.exit(1);
}









