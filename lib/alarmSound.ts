/**
 * Sistema de Sonido de Alarma para Botón de Pánico
 * 
 * Utiliza Web Audio API para generar sonidos de alarma intermitentes
 * sin necesidad de archivos de audio externos.
 */

class AlarmSound {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Crear contexto de audio solo en el navegador
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Inicia el sonido de alarma intermitente
   * @param frequency - Frecuencia del sonido en Hz (default: 880Hz - La alta)
   * @param duration - Duración de cada beep en ms (default: 200ms)
   * @param interval - Intervalo entre beeps en ms (default: 300ms)
   */
  start(frequency: number = 880, duration: number = 200, interval: number = 300): void {
    if (this.isPlaying || !this.audioContext) {
      console.warn('⚠️ Alarma ya está sonando o AudioContext no disponible');
      return;
    }

    console.log('🚨 Iniciando sonido de alarma...');
    this.isPlaying = true;

    // Reanudar el contexto de audio si está suspendido
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Función para reproducir un beep
    const playBeep = () => {
      if (!this.audioContext || !this.isPlaying) return;

      try {
        // Crear oscilador para el tono
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        // Configurar oscilador
        this.oscillator.type = 'sine'; // Tipo de onda: 'sine', 'square', 'sawtooth', 'triangle'
        this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Configurar ganancia (volumen)
        this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        // Conectar nodos
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        // Iniciar y detener el sonido
        this.oscillator.start(this.audioContext.currentTime);
        this.oscillator.stop(this.audioContext.currentTime + duration / 1000);

        // Limpiar nodos después de usar
        setTimeout(() => {
          this.oscillator?.disconnect();
          this.gainNode?.disconnect();
        }, duration);
      } catch (error) {
        console.error('Error al reproducir beep:', error);
      }
    };

    // Reproducir el primer beep inmediatamente
    playBeep();

    // Configurar intervalo para beeps continuos
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        playBeep();
      }
    }, interval);
  }

  /**
   * Detiene el sonido de alarma
   */
  stop(): void {
    if (!this.isPlaying) {
      console.warn('⚠️ Alarma no está sonando');
      return;
    }

    console.log('🛑 Deteniendo sonido de alarma...');
    this.isPlaying = false;

    // Limpiar intervalo
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Detener oscilador si está activo
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (error) {
        // El oscilador ya fue detenido
      }
      this.oscillator = null;
    }

    // Desconectar nodo de ganancia
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (error) {
        // Ya fue desconectado
      }
      this.gainNode = null;
    }
  }

  /**
   * Reproduce un patrón de alarma de emergencia (2 tonos alternados)
   */
  startEmergencyPattern(): void {
    if (this.isPlaying || !this.audioContext) {
      console.warn('⚠️ Alarma ya está sonando o AudioContext no disponible');
      return;
    }

    console.log('🚨 Iniciando patrón de alarma de emergencia...');
    this.isPlaying = true;

    // Reanudar el contexto de audio si está suspendido
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    let highTone = true;

    const playEmergencyBeep = () => {
      if (!this.audioContext || !this.isPlaying) return;

      try {
        // Crear oscilador
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        // Alternar entre dos frecuencias
        const frequency = highTone ? 880 : 659; // La alta (880Hz) y Mi (659Hz)
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Volumen
        this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

        // Conectar
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        // Reproducir
        const duration = 200;
        this.oscillator.start(this.audioContext.currentTime);
        this.oscillator.stop(this.audioContext.currentTime + duration / 1000);

        // Limpiar
        setTimeout(() => {
          this.oscillator?.disconnect();
          this.gainNode?.disconnect();
        }, duration);

        // Alternar tono para siguiente beep
        highTone = !highTone;
      } catch (error) {
        console.error('Error al reproducir beep de emergencia:', error);
      }
    };

    // Primer beep
    playEmergencyBeep();

    // Patrón: beep-beep-pausa-beep-beep-pausa
    let beepCount = 0;
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        beepCount++;
        playEmergencyBeep();
        
        // Pausa más larga cada 2 beeps
        if (beepCount % 2 === 0) {
          setTimeout(() => {
            if (this.isPlaying) {
              playEmergencyBeep();
            }
          }, 100);
        }
      }
    }, 400);
  }

  /**
   * Verifica si la alarma está sonando
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Limpia recursos
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Instancia singleton
let alarmInstance: AlarmSound | null = null;

/**
 * Obtiene la instancia del sonido de alarma (Singleton)
 */
export const getAlarmSound = (): AlarmSound => {
  if (!alarmInstance) {
    alarmInstance = new AlarmSound();
  }
  return alarmInstance;
};

/**
 * Hook de React para usar el sonido de alarma
 */
export const useAlarmSound = () => {
  const alarm = getAlarmSound();

  const startAlarm = (pattern: 'simple' | 'emergency' = 'emergency') => {
    if (pattern === 'emergency') {
      alarm.startEmergencyPattern();
    } else {
      alarm.start();
    }
  };

  const stopAlarm = () => {
    alarm.stop();
  };

  const isPlaying = () => {
    return alarm.getIsPlaying();
  };

  return {
    startAlarm,
    stopAlarm,
    isPlaying,
  };
};

export default AlarmSound;


