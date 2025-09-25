import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const METRICS_FILE = path.join(LOGS_DIR, 'metrics.json');

// Asegurar que el directorio de logs existe
async function ensureLogsDirectory() {
  try {
    await fs.access(LOGS_DIR);
  } catch {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  }
}

// Función para actualizar métricas
async function updateMetrics() {
  await ensureLogsDirectory();
  
  const timestamp = new Date().toISOString();
  const metrics = {
    timestamp,
    users: {
      total: 0,
      active: 0,
      byRole: {
        visitante: 0,
        comunidad: 0,
        admin: 0,
        super_admin: 0
      }
    },
    activity: {
      actionsToday: 0,
      lastUpdated: timestamp
    },
    system: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    }
  };
  
  try {
    await fs.writeFile(METRICS_FILE, JSON.stringify(metrics, null, 2));
    return metrics;
  } catch (error) {
    console.error('Error writing metrics file:', error);
    throw error;
  }
}

// Función para leer métricas
async function readMetrics() {
  try {
    await ensureLogsDirectory();
    
    // Verificar si el archivo existe
    try {
      await fs.access(METRICS_FILE);
    } catch {
      // Si no existe, crear métricas iniciales
      return await updateMetrics();
    }
    
    const content = await fs.readFile(METRICS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading metrics:', error);
    throw error;
  }
}

// GET - Obtener métricas del sistema
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obteniendo métricas del sistema...');
    
    // Obtener datos reales de usuarios desde Firestore
    let userMetrics = {
      total: 0,
      active: 0,
      inactive: 0,
      deleted: 0,
      byRole: {
        visitante: 0,
        comunidad: 0,
        admin: 0,
        super_admin: 0
      }
    };

    try {
      // Importar Firebase dinámicamente
      const { initializeApp } = await import('firebase/app');
      const { getFirestore, collection, getDocs } = await import('firebase/firestore');
      
      // Configuración de Firebase
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      // Inicializar Firebase
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);

      console.log('🔍 Obteniendo usuarios desde Firestore...');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log(`📈 Documentos encontrados: ${usersSnapshot.size}`);

      // Procesar usuarios
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        userMetrics.total++;
        
        // Contar por estado
        const status = userData.status || (userData.isActive ? 'active' : 'inactive');
        if (status === 'active') userMetrics.active++;
        else if (status === 'inactive') userMetrics.inactive++;
        else if (status === 'deleted') userMetrics.deleted++;
        
        // Contar por rol
        const role = userData.role || 'visitante';
        if (userMetrics.byRole[role] !== undefined) {
          userMetrics.byRole[role]++;
        }
        
        console.log(`👤 Usuario: ${userData.email}, Rol: ${role}, Estado: ${status}`);
      });

      console.log('✅ Métricas de usuarios calculadas:', userMetrics);
      
    } catch (firebaseError) {
      console.error('❌ Error al obtener usuarios desde Firebase:', firebaseError);
      // Usar métricas por defecto si hay error
      userMetrics = {
        total: 0,
        active: 0,
        inactive: 0,
        deleted: 0,
        byRole: { visitante: 0, comunidad: 0, admin: 0, super_admin: 0 }
      };
    }
    
    // Calcular acciones de hoy desde los logs
    const logFile = path.join(LOGS_DIR, 'system.log');
    let actionsToday = 0;
    
    try {
      await fs.access(logFile);
      const logContent = await fs.readFile(logFile, 'utf-8');
      const lines = logContent.trim().split('\n').filter(line => line.trim());
      
      const today = new Date().toDateString();
      actionsToday = lines.filter(line => {
        try {
          const log = JSON.parse(line);
          const logDate = new Date(log.timestamp).toDateString();
          return logDate === today;
        } catch {
          return false;
        }
      }).length;
      
      console.log(`📝 Acciones de hoy: ${actionsToday}`);
    } catch {
      actionsToday = 0;
    }
    
    // Crear métricas actualizadas
    const metrics = {
      timestamp: new Date().toISOString(),
      users: userMetrics,
      activity: {
        actionsToday: actionsToday,
        lastUpdated: new Date().toISOString()
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
    
    console.log('✅ Métricas finales:', JSON.stringify(metrics, null, 2));
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('❌ Error getting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}

// POST - Actualizar métricas
export async function POST(request: NextRequest) {
  try {
    const { userCounts, action } = await request.json();
    
    const metrics = await readMetrics();
    
    // Actualizar conteos de usuarios si se proporcionan
    if (userCounts) {
      metrics.users = userCounts;
    }
    
    // Actualizar timestamp
    metrics.timestamp = new Date().toISOString();
    metrics.activity.lastUpdated = new Date().toISOString();
    
    // Actualizar métricas del sistema
    metrics.system = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    };
    
    // Si se registró una acción, incrementar contador
    if (action) {
      metrics.activity.actionsToday = (metrics.activity.actionsToday || 0) + 1;
    }
    
    await fs.writeFile(METRICS_FILE, JSON.stringify(metrics, null, 2));
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error updating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to update metrics' },
      { status: 500 }
    );
  }
}
