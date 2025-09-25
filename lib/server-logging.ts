// Sistema de logging del servidor usando API routes de Next.js

export interface ServerLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  details?: any;
}

export interface SystemMetrics {
  timestamp: string;
  users: {
    total: number;
    active: number;
    byRole: {
      visitante: number;
      comunidad: number;
      admin: number;
      super_admin: number;
    };
  };
  activity: {
    actionsToday: number;
    lastUpdated: string;
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    nodeVersion: string;
  };
}

// Función para crear un log en el servidor
export const createServerLog = async (
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  message: string,
  details?: any
): Promise<ServerLog> => {
  try {
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        details
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating server log:', error);
    // Fallback: log to console if server logging fails
    console.log(`[${level}] ${message}`, details);
    throw error;
  }
};

// Función para obtener logs del servidor
export const getServerLogs = async (limit: number = 100): Promise<ServerLog[]> => {
  try {
    const response = await fetch(`/api/logs?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting server logs:', error);
    throw error;
  }
};

// Función para limpiar logs del servidor
export const clearServerLogs = async (): Promise<void> => {
  try {
    const response = await fetch('/api/logs', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error clearing server logs:', error);
    throw error;
  }
};

// Función para obtener métricas del sistema
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    const response = await fetch('/api/metrics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting system metrics:', error);
    throw error;
  }
};

// Función para actualizar métricas del sistema
export const updateSystemMetrics = async (
  userCounts?: any,
  action?: string
): Promise<SystemMetrics> => {
  try {
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userCounts,
        action
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating system metrics:', error);
    throw error;
  }
};

// Funciones de conveniencia para logging
export const logInfo = (message: string, details?: any) => 
  createServerLog('INFO', message, details);

export const logWarning = (message: string, details?: any) => 
  createServerLog('WARN', message, details);

export const logError = (message: string, details?: any) => 
  createServerLog('ERROR', message, details);

export const logDebug = (message: string, details?: any) => 
  createServerLog('DEBUG', message, details);

// Función para logging de acciones del sistema
export const logSystemAction = async (
  action: string,
  userId: string,
  userEmail: string,
  details: any = {}
): Promise<void> => {
  try {
    await createServerLog('INFO', `System action: ${action}`, {
      action,
      userId,
      userEmail,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging system action:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
};
