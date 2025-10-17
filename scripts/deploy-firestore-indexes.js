#!/usr/bin/env node

/**
 * Script para desplegar índices de Firestore
 * 
 * Este script despliega los índices definidos en firestore.indexes.json
 * a Firebase Firestore para solucionar los errores de consultas.
 * 
 * Uso:
 *   node scripts/deploy-firestore-indexes.js
 * 
 * Requisitos:
 *   - Firebase CLI instalado (npm install -g firebase-tools)
 *   - Autenticado con Firebase (firebase login)
 *   - Proyecto configurado (firebase use --add)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
console.log(`${colors.cyan}🚀 DESPLEGANDO ÍNDICES DE FIRESTORE${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);

try {
  // Verificar que Firebase CLI esté instalado
  console.log(`${colors.yellow}1.${colors.reset} Verificando Firebase CLI...`);
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log(`${colors.green}✅${colors.reset} Firebase CLI está instalado\n`);
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} Firebase CLI no está instalado`);
    console.log(`${colors.yellow}   Instálalo con: npm install -g firebase-tools${colors.reset}\n`);
    process.exit(1);
  }

  // Verificar que estemos autenticados
  console.log(`${colors.yellow}2.${colors.reset} Verificando autenticación...`);
  try {
    execSync('firebase projects:list', { stdio: 'pipe' });
    console.log(`${colors.green}✅${colors.reset} Autenticado con Firebase\n`);
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} No estás autenticado con Firebase`);
    console.log(`${colors.yellow}   Autentícate con: firebase login${colors.reset}\n`);
    process.exit(1);
  }

  // Verificar que el archivo de índices existe
  console.log(`${colors.yellow}3.${colors.reset} Verificando archivo de índices...`);
  const indexPath = path.join(__dirname, '..', 'firestore.indexes.json');
  if (!fs.existsSync(indexPath)) {
    console.log(`${colors.red}❌${colors.reset} Archivo firestore.indexes.json no encontrado`);
    process.exit(1);
  }
  
  const indexes = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  console.log(`${colors.green}✅${colors.reset} Archivo encontrado con ${indexes.indexes.length} índices\n`);

  // Mostrar los índices que se van a desplegar
  console.log(`${colors.yellow}4.${colors.reset} Índices a desplegar:`);
  indexes.indexes.forEach((index, i) => {
    const fields = index.fields.map(f => `${f.fieldPath}(${f.order})`).join(', ');
    console.log(`   ${colors.cyan}${i + 1}.${colors.reset} ${index.collectionGroup} - [${fields}]`);
  });
  console.log();

  // Desplegar índices
  console.log(`${colors.yellow}5.${colors.reset} Desplegando índices a Firestore...`);
  console.log(`${colors.blue}   Ejecutando: firebase deploy --only firestore:indexes${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    execSync('firebase deploy --only firestore:indexes', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    console.log(`\n${colors.green}✅${colors.reset} Índices desplegados exitosamente en ${duration}s`);
    
  } catch (error) {
    console.log(`\n${colors.red}❌${colors.reset} Error desplegando índices:`);
    console.log(`${colors.red}   ${error.message}${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.green}🎉 DESPLIEGUE COMPLETADO${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
  
  console.log(`${colors.yellow}📋 Próximos pasos:${colors.reset}`);
  console.log(`${colors.cyan}1.${colors.reset} Los índices pueden tardar unos minutos en construirse`);
  console.log(`${colors.cyan}2.${colors.reset} Verifica en Firebase Console > Firestore > Indexes`);
  console.log(`${colors.cyan}3.${colors.reset} Las consultas de pánico y alertas deberían funcionar ahora`);
  console.log(`${colors.cyan}4.${colors.reset} Si persisten errores, verifica que las consultas usen los campos correctos\n`);

} catch (error) {
  console.log(`\n${colors.red}❌${colors.reset} Error inesperado:`);
  console.log(`${colors.red}   ${error.message}${colors.reset}\n`);
  process.exit(1);
}