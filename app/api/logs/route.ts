import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'system.log');

// Asegurar que el directorio de logs existe
async function ensureLogsDirectory() {
  try {
    await fs.access(LOGS_DIR);
  } catch {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  }
}

// Función para escribir logs
async function writeLog(level: string, message: string, details?: any) {
  await ensureLogsDirectory();
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    details: details || {},
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    await fs.appendFile(LOG_FILE, logLine);
    return logEntry;
  } catch (error) {
    console.error('Error writing to log file:', error);
    throw error;
  }
}

// Función para leer logs
async function readLogs(limit: number = 100) {
  try {
    await ensureLogsDirectory();
    
    // Verificar si el archivo existe
    try {
      await fs.access(LOG_FILE);
    } catch {
      return [];
    }
    
    const logContent = await fs.readFile(LOG_FILE, 'utf-8');
    const lines = logContent.trim().split('\n').filter(line => line.trim());
    
    const logs = lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return logs;
  } catch (error) {
    console.error('Error reading logs:', error);
    throw error;
  }
}

// POST - Crear un nuevo log
export async function POST(request: NextRequest) {
  try {
    const { level, message, details } = await request.json();
    
    if (!level || !message) {
      return NextResponse.json(
        { error: 'Level and message are required' },
        { status: 400 }
      );
    }
    
    const logEntry = await writeLog(level, message, details);
    
    return NextResponse.json(logEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json(
      { error: 'Failed to create log' },
      { status: 500 }
    );
  }
}

// GET - Leer logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const logs = await readLogs(limit);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error reading logs:', error);
    return NextResponse.json(
      { error: 'Failed to read logs' },
      { status: 500 }
    );
  }
}

// DELETE - Limpiar logs (solo para super admin)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autorización (esto debería verificarse con un middleware)
    await ensureLogsDirectory();
    
    // Crear backup antes de limpiar
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(LOGS_DIR, `backup-${timestamp}.log`);
    
    try {
      await fs.access(LOG_FILE);
      await fs.copyFile(LOG_FILE, backupFile);
    } catch {
      // El archivo no existe, no hay nada que respaldar
    }
    
    // Limpiar el archivo principal
    await fs.writeFile(LOG_FILE, '');
    
    // Log de la acción
    await writeLog('INFO', 'Logs cleared by administrator', {
      action: 'clear_logs',
      backupCreated: backupFile
    });
    
    return NextResponse.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    );
  }
}
