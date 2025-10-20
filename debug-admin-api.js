const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://callejerusalen-a78aa-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();
const adminAuth = admin.auth();

async function debugAdminAPI() {
  console.log('🔍 Debuggeando API de admin para solicitudes de cámaras...');
  
  try {
    // Buscar un usuario admin o super_admin
    const usersSnapshot = await db.collection('users').get();
    let adminUser = null;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (userData.role === 'admin' || userData.role === 'super_admin') {
        adminUser = { uid: doc.id, ...userData };
        break;
      }
    }
    
    if (!adminUser) {
      console.log('❌ No se encontró ningún usuario admin');
      return;
    }
    
    console.log(`✅ Usuario admin encontrado: ${adminUser.email} (${adminUser.role})`);
    
    // Crear un token personalizado para este usuario
    const customToken = await adminAuth.createCustomToken(adminUser.uid);
    console.log('🔑 Token personalizado creado');
    
    // Simular la llamada a la API
    console.log('\n📡 Simulando llamada a la API...');
    
    // Obtener solicitudes directamente de Firestore (como lo hace la API)
    const requestsSnapshot = await db.collection('cameraAccessRequests').get();
    console.log(`📋 Total de solicitudes en Firestore: ${requestsSnapshot.size}`);
    
    const requests = requestsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        cameraId: data.cameraId,
        cameraName: data.cameraName || 'Cámara sin nombre',
        reason: data.reason,
        status: data.status,
        requestedAt: data.requestedAt?.toDate() || new Date(),
        requestedBy: data.requestedBy,
        userEmail: data.userEmail,
        userName: data.userName,
        reviewedAt: data.reviewedAt?.toDate(),
        reviewedBy: data.reviewedBy,
        reviewNotes: data.reviewNotes
      };
    }).sort((a, b) => {
      const dateA = a.requestedAt instanceof Date ? a.requestedAt : new Date(a.requestedAt);
      const dateB = b.requestedAt instanceof Date ? b.requestedAt : new Date(b.requestedAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Estadísticas
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
    
    console.log('\n📊 Estadísticas calculadas:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Pendientes: ${stats.pending}`);
    console.log(`   Aprobadas: ${stats.approved}`);
    console.log(`   Rechazadas: ${stats.rejected}`);
    
    console.log('\n📋 Lista de solicitudes:');
    requests.forEach((request, index) => {
      console.log(`${index + 1}. ${request.userName} - ${request.cameraName} (${request.status})`);
    });
    
    // Simular la respuesta de la API
    const apiResponse = {
      success: true,
      requests,
      stats
    };
    
    console.log('\n🔧 Respuesta que debería devolver la API:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAdminAPI().catch(console.error);


