const https = require('https');
const http = require('http');

console.log('🔍 Probando API de historia...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/history',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Datos recibidos:');
      console.log(`  - Título: ${jsonData.historyData?.title}`);
      console.log(`  - Eventos: ${jsonData.historyData?.events?.length || 0}`);
      
      if (jsonData.historyData?.events?.length > 0) {
        console.log('🎉 Primeros eventos:');
        jsonData.historyData.events.slice(0, 3).forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.title} (${event.date})`);
        });
      } else {
        console.log('❌ No hay eventos en los datos');
      }
    } catch (error) {
      console.error('❌ Error al parsear JSON:', error);
      console.log('📄 Datos raw:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error en la petición:', error);
});

req.end();
