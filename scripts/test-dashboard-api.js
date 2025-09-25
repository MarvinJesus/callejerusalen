// Script simple para probar la API del dashboard
const fetch = require('node-fetch');

async function testDashboardAPI() {
  try {
    console.log('🔍 Probando API del dashboard...');
    
    // Probar la API de métricas
    console.log('\n📊 Probando /api/metrics...');
    const metricsResponse = await fetch('http://localhost:3000/api/metrics');
    
    if (metricsResponse.ok) {
      const metrics = await metricsResponse.json();
      console.log('✅ Métricas obtenidas:', JSON.stringify(metrics, null, 2));
    } else {
      console.log('❌ Error en métricas:', metricsResponse.status, metricsResponse.statusText);
    }
    
    // Probar la API de logs
    console.log('\n📝 Probando /api/logs...');
    const logsResponse = await fetch('http://localhost:3000/api/logs');
    
    if (logsResponse.ok) {
      const logs = await logsResponse.json();
      console.log('✅ Logs obtenidos:', logs.length, 'entradas');
      if (logs.length > 0) {
        console.log('Último log:', logs[0]);
      }
    } else {
      console.log('❌ Error en logs:', logsResponse.status, logsResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
  }
}

testDashboardAPI();
