'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { 
  Eye, 
  Grid3X3, 
  Grid2X2, 
  Layout, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Settings, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  Camera,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  ChevronDown,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Circle,
  Square,
  Monitor,
  Download
} from 'lucide-react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface Camera {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  coordinates: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  updatedAt?: Date;
}

type ViewMode = '1x1' | '2x2' | '3x3' | '4x4' | '1x4' | '1x8' | '2x3' | '3x2' | '4x2' | '6x1';
type SortBy = 'name' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const MonitoringPage = () => {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('3x3');
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGridFullscreen, setIsGridFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recordingCameras, setRecordingCameras] = useState<{ [key: string]: boolean }>({});
  const [convertingCameras, setConvertingCameras] = useState<{ [key: string]: boolean }>({});
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  
  // Estados para grabación de pantalla
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [screenRecorder, setScreenRecorder] = useState<MediaRecorder | null>(null);
  const [screenRecordingChunks, setScreenRecordingChunks] = useState<Blob[]>([]);
  
  // Estados para cámara maximizada
  const [maximizedCamera, setMaximizedCamera] = useState<Camera | null>(null);
  const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);
  const [isVideoZoomed, setIsVideoZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(50); // 50% por defecto (tamaño responsive)
  
  // Nueva estructura para el sistema de grabación
  const recordingRef = useRef<{ 
    [key: string]: { 
      frames: string[]; // URLs de los frames capturados
      startTime: number;
      intervalId: NodeJS.Timeout;
      isRecording: boolean;
      streamUrl: string;
      cameraName: string;
    } 
  }>({});
  
  const ffmpegRef = useRef<FFmpeg | null>(null);


  // Actualizar tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar cámaras
  useEffect(() => {
    loadCameras();
  }, []);

  // Inicializar FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        console.log('[FFMPEG] Inicializando FFmpeg...');
        const ffmpeg = new FFmpeg();
        
        // Cargar FFmpeg desde CDN
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        ffmpegRef.current = ffmpeg;
        setFfmpegLoaded(true);
        console.log('[FFMPEG] ✓ FFmpeg cargado exitosamente');
      } catch (error) {
        console.error('[FFMPEG] Error cargando FFmpeg:', error);
        setFfmpegLoaded(false);
      }
    };

    loadFFmpeg();
  }, []);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const camerasRef = collection(db, 'security_cameras');
      const q = query(camerasRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const camerasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Camera[];
      
      setCameras(camerasData);
    } catch (error) {
      console.error('Error loading cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para capturar un frame del stream usando canvas
  const captureFrame = async (cameraName: string): Promise<string> => {
    try {
      // Buscar el elemento de imagen del stream
      const imgElement = document.querySelector(`img[alt="${cameraName}"]`) as HTMLImageElement;
      if (!imgElement) {
        throw new Error('No se encontró el elemento de imagen');
      }

      // Crear un canvas temporal para capturar el frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener contexto del canvas');
      }

      // Establecer dimensiones del canvas
      canvas.width = imgElement.naturalWidth || imgElement.width || 1920;
      canvas.height = imgElement.naturalHeight || imgElement.height || 1080;

      // Dibujar la imagen actual en el canvas
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

      // Convertir canvas a blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const frameUrl = URL.createObjectURL(blob);
            resolve(frameUrl);
          } else {
            reject(new Error('Error al convertir canvas a blob'));
          }
        }, 'image/jpeg', 0.8);
      });
    } catch (error) {
      console.error('[CAPTURE] Error capturando frame:', error);
      throw error;
    }
  };

  // Función para convertir frames a video usando FFmpeg
  const convertFramesToVideo = async (frames: string[], cameraName: string, startTime: number): Promise<void> => {
    if (!ffmpegRef.current || !ffmpegLoaded) {
      console.error('[CONVERT] FFmpeg no está cargado');
      alert('Error: FFmpeg no está disponible');
      return;
    }

    try {
      console.log(`[CONVERT] ========== INICIANDO CONVERSIÓN ==========`);
      console.log(`[CONVERT] Total frames: ${frames.length}`);
      console.log(`[CONVERT] Cámara: ${cameraName}`);

      const ffmpeg = ffmpegRef.current;
      
      // Escribir cada frame al sistema de archivos de FFmpeg
      for (let i = 0; i < frames.length; i++) {
        const frameData = await fetchFile(frames[i]);
        await ffmpeg.writeFile(`frame_${i.toString().padStart(4, '0')}.jpg`, frameData);
      }

      // Crear archivo de lista para FFmpeg
      const listContent = frames.map((_, i) => `file 'frame_${i.toString().padStart(4, '0')}.jpg'`).join('\n');
      await ffmpeg.writeFile('frames.txt', listContent);

      // Convertir frames a video
      const timestamp = new Date(startTime).toISOString().replace(/[:.]/g, '-');
      const outputFileName = `${cameraName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.mp4`;
      
      console.log('[CONVERT] Ejecutando FFmpeg...');
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'frames.txt',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-r', '5', // 5 FPS (coincide con la captura)
        '-y', // Sobrescribir archivo
        outputFileName
      ]);

      // Leer el archivo de video generado
      const videoData = await ffmpeg.readFile(outputFileName);
      // Crear blob directamente desde los datos
      const videoBlob = new Blob([videoData as any], { type: 'video/mp4' });
      
      // Descargar el video
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Limpiar URLs de frames
      frames.forEach(frameUrl => URL.revokeObjectURL(frameUrl));
      
      // Limpiar archivos de FFmpeg
      for (let i = 0; i < frames.length; i++) {
        try {
          await ffmpeg.deleteFile(`frame_${i.toString().padStart(4, '0')}.jpg`);
        } catch (e) {
          // Ignorar errores de limpieza
        }
      }
      
      try {
        await ffmpeg.deleteFile('frames.txt');
        await ffmpeg.deleteFile(outputFileName);
      } catch (e) {
        // Ignorar errores de limpieza
      }
      
        URL.revokeObjectURL(url);
      console.log('[CONVERT] ========== CONVERSIÓN COMPLETADA ==========');
      
    } catch (error) {
      console.error('[CONVERT] Error en conversión:', error);
      alert('Error al convertir el video');
    }
  };

  // Función para iniciar la grabación
  const startRecording = async (cameraId: string, cameraName: string) => {
    try {
      console.log(`[START] ========== INICIANDO NUEVA GRABACIÓN ==========`);
      console.log(`[START] Cámara: ${cameraName}`);
      console.log(`[START] FFmpeg cargado: ${ffmpegLoaded}`);
      
      if (!ffmpegLoaded) {
        alert('FFmpeg aún se está cargando. Espera un momento e intenta de nuevo.');
        return;
      }

      const startTime = Date.now();
      const frames: string[] = [];

      // Configurar la grabación
      recordingRef.current[cameraId] = {
        frames,
        startTime,
        intervalId: null as any,
        isRecording: true,
        streamUrl: '', // No lo necesitamos para esta implementación
        cameraName
      };

      // Capturar frames cada 200ms (5 FPS) para evitar sobrecarga
      const captureInterval = setInterval(async () => {
        const recording = recordingRef.current[cameraId];
        if (!recording || !recording.isRecording) {
          clearInterval(captureInterval);
          return;
        }

        try {
          const frameUrl = await captureFrame(recording.cameraName);
          recording.frames.push(frameUrl);
          console.log(`[CAPTURE] Frame capturado. Total: ${recording.frames.length}`);
        } catch (error) {
          console.error('[CAPTURE] Error capturando frame:', error);
        }
      }, 200); // 200ms = 5 FPS

      // Guardar el intervalo
      recordingRef.current[cameraId].intervalId = captureInterval;

      setRecordingCameras(prev => ({ ...prev, [cameraId]: true }));
      console.log(`[START] ✓ Grabación iniciada - capturando frames cada 200ms (5 FPS)`);

    } catch (error) {
      console.error('[START] Error al iniciar la grabación:', error);
      alert('Error al iniciar la grabación');
    }
  };

  // Función para detener la grabación
  const stopRecording = async (cameraId: string) => {
    const recording = recordingRef.current[cameraId];
    if (!recording) {
      console.warn(`[STOP] No hay grabación activa para cámara ${cameraId}`);
      return;
    }
    
    console.log(`[STOP] ========== DETENIENDO GRABACIÓN ==========`);
    console.log(`[STOP] CameraId: ${cameraId}`);
    console.log(`[STOP] Frames capturados: ${recording.frames.length}`);
    
    // Detener la captura
    recording.isRecording = false;
    
    // Limpiar intervalo
    if (recording.intervalId) {
    clearInterval(recording.intervalId);
      console.log('[STOP] Intervalo de captura limpiado');
    }
    
    // Marcar que NO debe reiniciar
    setRecordingCameras(prev => {
      const newState = { ...prev };
      console.log('[STOP] Estado antes de eliminar:', prev);
      delete newState[cameraId];
      console.log('[STOP] Estado después de eliminar:', newState);
      console.log('[STOP] Estado marcado como detenido');
      return newState;
    });
    
    // Convertir frames a video si hay frames capturados
    if (recording.frames.length > 0) {
      console.log(`[STOP] Iniciando conversión de ${recording.frames.length} frames...`);
      setConvertingCameras(prev => ({ ...prev, [cameraId]: true }));
      
      try {
        await convertFramesToVideo(recording.frames, recording.cameraName, recording.startTime);
        console.log('[STOP] ✓ Conversión completada');
      } catch (error) {
        console.error('[STOP] Error en conversión:', error);
        alert('Error al convertir el video');
      } finally {
        setConvertingCameras(prev => {
          const newState = { ...prev };
          delete newState[cameraId];
          return newState;
        });
      }
    } else {
      console.warn('[STOP] No hay frames para convertir');
      alert('No se capturaron frames para convertir');
    }
    
    // Limpiar la referencia
    delete recordingRef.current[cameraId];
    console.log('[STOP] Referencia limpiada');
  };

  // Función para toggle de grabación
  const toggleRecording = async (cameraId: string, cameraName: string) => {
    console.log(`[TOGGLE] ========== TOGGLE GRABACIÓN ==========`);
    console.log(`[TOGGLE] Cámara: ${cameraName} (ID: ${cameraId})`);
    console.log(`[TOGGLE] Estado actual: ${recordingCameras[cameraId] ? 'GRABANDO' : 'NO GRABANDO'}`);
    console.log(`[TOGGLE] Estado recordingCameras:`, recordingCameras);
    
    if (recordingCameras[cameraId]) {
      console.log('[TOGGLE] → Deteniendo grabación...');
      await stopRecording(cameraId);
      console.log('[TOGGLE] → stopRecording completado');
    } else {
      console.log('[TOGGLE] → Iniciando grabación...');
      await startRecording(cameraId, cameraName);
      console.log('[TOGGLE] → startRecording completado');
    }
    
    console.log(`[TOGGLE] Estado final:`, recordingCameras);
    console.log(`[TOGGLE] ========================================`);
  };

  // Funciones para grabación de pantalla
  const startScreenRecording = async () => {
    try {
      console.log('[SCREEN_RECORD] Iniciando grabación de pantalla...');
      
      // Verificar si el navegador soporta la API de captura de pantalla
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Tu navegador no soporta la grabación de pantalla. Usa Chrome, Firefox o Edge.');
        return;
      }

      // Solicitar permisos para capturar la pantalla
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true // Incluir audio si está disponible
      });

      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9' // Usar VP9 para mejor compresión
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[SCREEN_RECORD] Grabación detenida, procesando video...');
        
        // Crear blob del video
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        
        // Crear URL y descargar
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generar nombre de archivo con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `screen_recording_${timestamp}.webm`;
        
        // Descargar archivo
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Limpiar URL
        URL.revokeObjectURL(url);
        
        // Limpiar chunks
        setScreenRecordingChunks([]);
        
        console.log('[SCREEN_RECORD] Video descargado exitosamente');
      };

      mediaRecorder.onerror = (event) => {
        console.error('[SCREEN_RECORD] Error en grabación:', event);
        alert('Error durante la grabación de pantalla');
        setIsScreenRecording(false);
        setScreenRecorder(null);
      };

      // Configurar cuando se detenga el stream (usuario cierra la ventana de selección)
      stream.getVideoTracks()[0].onended = () => {
        console.log('[SCREEN_RECORD] Stream terminado por el usuario');
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        setIsScreenRecording(false);
        setScreenRecorder(null);
      };

      // Iniciar grabación
      mediaRecorder.start(1000); // Capturar datos cada segundo
      
      setScreenRecorder(mediaRecorder);
      setScreenRecordingChunks(chunks);
      setIsScreenRecording(true);
      
      console.log('[SCREEN_RECORD] ✓ Grabación de pantalla iniciada');
      
    } catch (error) {
      console.error('[SCREEN_RECORD] Error iniciando grabación:', error);
      alert('Error al iniciar la grabación de pantalla. Asegúrate de seleccionar una ventana o pantalla.');
      setIsScreenRecording(false);
      setScreenRecorder(null);
    }
  };

  const stopScreenRecording = () => {
    if (screenRecorder && screenRecorder.state === 'recording') {
      console.log('[SCREEN_RECORD] Deteniendo grabación...');
      screenRecorder.stop();
      
      // Detener todas las pistas de media
      screenRecorder.stream.getTracks().forEach(track => track.stop());
      
      setIsScreenRecording(false);
      setScreenRecorder(null);
    }
  };

  // Funciones para maximizar cámara
  const maximizeCamera = async (camera: Camera) => {
    try {
      console.log('[MAXIMIZE] Maximizando cámara:', camera.name);
      setMaximizedCamera(camera);
      
      // Crear elemento de video para pantalla completa
      const videoElement = document.createElement('div');
      videoElement.id = 'fullscreen-camera-container';
      videoElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: black;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      // Crear imagen del stream
      const imgElement = document.createElement('img');
      imgElement.id = 'fullscreen-camera-stream';
      imgElement.src = `${camera.streamUrl}?t=${Date.now()}`;
      imgElement.alt = camera.name;
      
      // Establecer tamaño responsive por defecto con proporción 16:9
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // Tamaño móvil: 90% del ancho con proporción 16:9
        const mobileWidth = window.innerWidth * 0.9;
        const mobileHeight = mobileWidth / (16/9);
        
      imgElement.style.cssText = `
          width: ${mobileWidth}px;
          height: ${mobileHeight}px;
          max-width: 90vw;
          max-height: 80vh;
        object-fit: contain;
          aspect-ratio: 16/9;
        `;
      } else {
        // Tamaño desktop: 80% del ancho con proporción 16:9
        const desktopWidth = window.innerWidth * 0.8;
        const desktopHeight = desktopWidth / (16/9);
        
        imgElement.style.cssText = `
          width: ${desktopWidth}px;
          height: ${desktopHeight}px;
          max-width: 80vw;
          max-height: 70vh;
          object-fit: contain;
          aspect-ratio: 16/9;
        `;
      }
      
      // Crear overlay de controles
      const controlsOverlay = document.createElement('div');
      controlsOverlay.id = 'fullscreen-camera-controls';
      controlsOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
        padding: 20px;
        z-index: 10000;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      // Información de la cámara
      const cameraInfo = document.createElement('div');
      cameraInfo.style.cssText = `
        color: white;
        display: flex;
        align-items: center;
        gap: 15px;
      `;
      cameraInfo.innerHTML = `
        <div>
          <h2 style="margin: 0; font-size: 24px; font-weight: bold;">${camera.name}</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">${camera.description}</p>
        </div>
        <div style="
          background: ${camera.status === 'active' ? '#10b981' : camera.status === 'inactive' ? '#f59e0b' : '#ef4444'};
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          text-transform: capitalize;
        ">
          ${camera.status}
        </div>
      `;
      
      // Controles
      const controls = document.createElement('div');
      controls.style.cssText = `
        display: flex;
        gap: 10px;
        align-items: center;
      `;
      
      // Botón de grabación de pantalla
      const recordButton = document.createElement('button');
      recordButton.id = 'fullscreen-record-button';
      recordButton.style.cssText = `
        background: ${isScreenRecording ? '#dc2626' : '#374151'};
        color: white;
        border: none;
        padding: 12px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        ${isScreenRecording ? 'animation: pulse 2s infinite;' : ''}
      `;
      recordButton.innerHTML = isScreenRecording ? 
        '<svg width="20" height="20" fill="currentColor"><rect width="12" height="12" x="4" y="4" rx="2"/></svg>' :
        '<svg width="20" height="20" fill="currentColor"><circle cx="10" cy="10" r="8"/></svg>';
      recordButton.title = isScreenRecording ? 'Detener grabación de pantalla' : 'Iniciar grabación de pantalla';
      
      // Contenedor del slider de zoom
      const zoomContainer = document.createElement('div');
      zoomContainer.id = 'fullscreen-zoom-container';
      zoomContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(0,0,0,0.7);
        padding: 8px 12px;
        border-radius: 25px;
        backdrop-filter: blur(10px);
      `;
      
      // Etiqueta del zoom
      const zoomLabel = document.createElement('span');
      zoomLabel.style.cssText = `
        color: white;
        font-size: 12px;
        font-weight: 500;
        min-width: 35px;
        text-align: center;
      `;
      zoomLabel.textContent = '50%';
      
      // Slider de zoom
      const zoomSlider = document.createElement('input');
      zoomSlider.id = 'fullscreen-zoom-slider';
      zoomSlider.type = 'range';
      zoomSlider.min = '10';
      zoomSlider.max = '100';
      zoomSlider.value = '50';
      zoomSlider.step = '5';
      zoomSlider.style.cssText = `
        width: 120px;
        height: 6px;
        background: #374151;
        outline: none;
        border-radius: 3px;
        cursor: pointer;
        -webkit-appearance: none;
      `;
      
      // Estilos personalizados para el slider
      zoomSlider.style.setProperty('background', 'linear-gradient(to right, #3b82f6 0%, #3b82f6 50%, #374151 50%, #374151 100%)');
      
      // Event listener para el slider
      zoomSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value);
        zoomLabel.textContent = value + '%';
        
        // Actualizar el gradiente del slider
        const percentage = value;
        zoomSlider.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`;
        
        // Aplicar zoom
        applyZoom(value);
      });
      
      // Ensamblar contenedor de zoom
      zoomContainer.appendChild(zoomLabel);
      zoomContainer.appendChild(zoomSlider);
      
      // Botón de salir
      const exitButton = document.createElement('button');
      exitButton.style.cssText = `
        background: #374151;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      `;
      exitButton.innerHTML = '<svg width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      exitButton.title = 'Salir de pantalla completa (ESC)';
      
      // Event listeners
      recordButton.addEventListener('click', () => {
        if (isScreenRecording) {
          stopScreenRecording();
        } else {
          startScreenRecording();
        }
      });
      
      exitButton.addEventListener('click', closeFullscreenCamera);
      
      // Ensamblar elementos
      controls.appendChild(recordButton);
      controls.appendChild(zoomContainer);
      controls.appendChild(exitButton);
      controlsOverlay.appendChild(cameraInfo);
      controlsOverlay.appendChild(controls);
      videoElement.appendChild(imgElement);
      videoElement.appendChild(controlsOverlay);
      document.body.appendChild(videoElement);
      
      // Aplicar zoom inicial (50% = tamaño responsive por defecto)
      setTimeout(() => {
        applyZoom(50);
      }, 100);
      
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      
      setIsCameraFullscreen(true);
      console.log('[MAXIMIZE] ✓ Cámara en pantalla completa');
      
    } catch (error) {
      console.error('[MAXIMIZE] Error maximizando cámara:', error);
      alert('Error al maximizar la cámara');
    }
  };

  const closeFullscreenCamera = () => {
    console.log('[MAXIMIZE] Cerrando pantalla completa');
    
    // Remover elemento de pantalla completa
    const fullscreenElement = document.getElementById('fullscreen-camera-container');
    if (fullscreenElement) {
      document.body.removeChild(fullscreenElement);
    }
    
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
    
    setMaximizedCamera(null);
    setIsCameraFullscreen(false);
    setIsVideoZoomed(false); // Resetear estado de zoom
    setZoomLevel(50); // Resetear nivel de zoom a 50%
  };

  // Función para aplicar zoom basado en el nivel del slider
  const applyZoom = (level: number) => {
    const videoElement = document.getElementById('fullscreen-camera-stream');
    if (!videoElement) {
      console.log('[ZOOM] Error: No se encontró el elemento de video');
      return;
    }
    
    console.log('[ZOOM] Aplicando zoom nivel:', level + '%');
    
    const isMobile = window.innerWidth < 768;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const aspectRatio = 16 / 9;
    
    // Calcular dimensiones base (50% = tamaño responsive por defecto)
    let baseWidth, baseHeight;
    
    if (isMobile) {
      // Tamaño base móvil: 90% del ancho
      baseWidth = containerWidth * 0.9;
      baseHeight = baseWidth / aspectRatio;
    } else {
      // Tamaño base desktop: 80% del ancho
      baseWidth = containerWidth * 0.8;
      baseHeight = baseWidth / aspectRatio;
    }
    
    // Calcular dimensiones máximas (100% = pantalla completa)
    let maxWidth, maxHeight;
    
    if (containerWidth / containerHeight > aspectRatio) {
      // El contenedor es más ancho que 16:9, ajustar por altura
      maxHeight = containerHeight * 0.95; // 95% para dejar espacio para controles
      maxWidth = maxHeight * aspectRatio;
    } else {
      // El contenedor es más alto que 16:9, ajustar por ancho
      maxWidth = containerWidth * 0.95; // 95% para dejar espacio para controles
      maxHeight = maxWidth / aspectRatio;
    }
    
    // Interpolar entre tamaño base y máximo basado en el nivel de zoom
    const zoomFactor = level / 100;
    const currentWidth = baseWidth + (maxWidth - baseWidth) * zoomFactor;
    const currentHeight = baseHeight + (maxHeight - baseHeight) * zoomFactor;
    
    console.log('[ZOOM] Dimensiones calculadas:', currentWidth.toFixed(0), 'x', currentHeight.toFixed(0));
    
    // Aplicar estilos
    if (level >= 100) {
      // Zoom máximo: usar object-fit cover
      videoElement.style.cssText = `
        width: ${maxWidth}px !important;
        height: ${maxHeight}px !important;
        max-width: none !important;
        max-height: none !important;
        object-fit: cover !important;
        aspect-ratio: 16/9 !important;
      `;
    } else {
      // Zoom intermedio: usar object-fit contain
      videoElement.style.cssText = `
        width: ${currentWidth}px !important;
        height: ${currentHeight}px !important;
        max-width: none !important;
        max-height: none !important;
        object-fit: contain !important;
        aspect-ratio: 16/9 !important;
      `;
    }
    
    // Actualizar estado de zoom
    setIsVideoZoomed(level > 50);
  };

  // Función para manejar el cambio del slider de zoom
  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newZoomLevel = parseInt(event.target.value);
    setZoomLevel(newZoomLevel);
    applyZoom(newZoomLevel);
  };

  // Función para maximizar el grid de cámaras
  const maximizeGrid = () => {
    console.log('[GRID_FULLSCREEN] Maximizando grid de cámaras');
    
    // Crear contenedor de pantalla completa para el grid
    const gridContainer = document.createElement('div');
    gridContainer.id = 'grid-fullscreen-container';
    gridContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #111827;
      z-index: 9998;
      display: flex;
      flex-direction: column;
    `;
    
    // Crear header con controles
    const gridHeader = document.createElement('div');
    gridHeader.id = 'grid-fullscreen-header';
    gridHeader.style.cssText = `
      background: #1f2937;
      border-bottom: 1px solid #374151;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;
    
    // Título y información
    const headerInfo = document.createElement('div');
    headerInfo.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
      color: white;
    `;
    headerInfo.innerHTML = `
      <div>
        <h2 style="margin: 0; font-size: 24px; font-weight: bold;">Centro de Monitoreo - Pantalla Completa</h2>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #9ca3af;">${filteredCameras.length} de ${cameras.length} cámaras</p>
      </div>
    `;
    
    // Controles del header
    const headerControls = document.createElement('div');
    headerControls.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    
    // Selector de modo de vista
    const viewModeSelect = document.createElement('select');
    viewModeSelect.id = 'grid-fullscreen-view-mode';
    viewModeSelect.style.cssText = `
      background: #374151;
      color: white;
      border: 1px solid #4b5563;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
    `;
    
    const viewModes = [
      { value: '1x1', label: '1x1' },
      { value: '2x2', label: '2x2' },
      { value: '3x3', label: '3x3' },
      { value: '4x4', label: '4x4' },
      { value: '1x4', label: '1x4' },
      { value: '1x8', label: '1x8' },
      { value: '2x3', label: '2x3' },
      { value: '3x2', label: '3x2' },
      { value: '4x2', label: '4x2' },
      { value: '6x1', label: '6x1' }
    ];
    
    viewModes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.value;
      option.textContent = mode.label;
      if (mode.value === viewMode) option.selected = true;
      viewModeSelect.appendChild(option);
    });
    
    // Botón de actualizar
    const refreshButton = document.createElement('button');
    refreshButton.style.cssText = `
      background: #374151;
      color: white;
      border: none;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    `;
    refreshButton.innerHTML = '<svg width="16" height="16" fill="currentColor"><path d="M4 12a8 8 0 018-8V2.5l3 3-3 3V7a6 6 0 10-6 6h1.5a8 8 0 008-8z"/></svg>';
    refreshButton.title = 'Actualizar cámaras';
    
    // Botón de salir
    const exitButton = document.createElement('button');
    exitButton.style.cssText = `
      background: #374151;
      color: white;
      border: none;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    `;
    exitButton.innerHTML = '<svg width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    exitButton.title = 'Salir de pantalla completa (ESC)';
    
    // Event listeners
    viewModeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      setViewMode(target.value as ViewMode);
    });
    
    refreshButton.addEventListener('click', loadCameras);
    exitButton.addEventListener('click', closeGridFullscreen);
    
    // Ensamblar header
    headerControls.appendChild(viewModeSelect);
    headerControls.appendChild(refreshButton);
    headerControls.appendChild(exitButton);
    gridHeader.appendChild(headerInfo);
    gridHeader.appendChild(headerControls);
    
    // Crear contenedor del grid
    const gridContent = document.createElement('div');
    gridContent.id = 'grid-fullscreen-content';
    gridContent.style.cssText = `
      flex: 1;
      padding: 16px;
      overflow: auto;
    `;
    
    // Ensamblar elementos
    gridContainer.appendChild(gridHeader);
    gridContainer.appendChild(gridContent);
    document.body.appendChild(gridContainer);
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    setIsGridFullscreen(true);
    console.log('[GRID_FULLSCREEN] ✓ Grid en pantalla completa');
  };

  // Función para cerrar la pantalla completa del grid
  const closeGridFullscreen = () => {
    console.log('[GRID_FULLSCREEN] Cerrando pantalla completa del grid');
    
    // Remover elemento de pantalla completa
    const gridElement = document.getElementById('grid-fullscreen-container');
    if (gridElement) {
      document.body.removeChild(gridElement);
    }
    
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
    
    setIsGridFullscreen(false);
  };

  // Función para manejar tecla ESC para cerrar vista maximizada
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (maximizedCamera || isCameraFullscreen) {
        closeFullscreenCamera();
        } else if (isGridFullscreen) {
          closeGridFullscreen();
        }
      }
    };

    if (maximizedCamera || isCameraFullscreen || isGridFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [maximizedCamera, isCameraFullscreen, isGridFullscreen]);

  // Actualizar botón de grabación en pantalla completa cuando cambie el estado
  useEffect(() => {
    const recordButton = document.getElementById('fullscreen-record-button');
    if (recordButton) {
      recordButton.style.background = isScreenRecording ? '#dc2626' : '#374151';
      recordButton.innerHTML = isScreenRecording ? 
        '<svg width="20" height="20" fill="currentColor"><rect width="12" height="12" x="4" y="4" rx="2"/></svg>' :
        '<svg width="20" height="20" fill="currentColor"><circle cx="10" cy="10" r="8"/></svg>';
      recordButton.title = isScreenRecording ? 'Detener grabación de pantalla' : 'Iniciar grabación de pantalla';
      
      if (isScreenRecording) {
        recordButton.style.animation = 'pulse 2s infinite';
      } else {
        recordButton.style.animation = 'none';
      }
    }
  }, [isScreenRecording]);

  // Actualizar slider de zoom en pantalla completa cuando cambie el estado
  useEffect(() => {
    const zoomSlider = document.getElementById('fullscreen-zoom-slider') as HTMLInputElement;
    const zoomLabel = document.querySelector('#fullscreen-zoom-container span') as HTMLSpanElement;
    
    if (zoomSlider && zoomLabel) {
      zoomSlider.value = zoomLevel.toString();
      zoomLabel.textContent = zoomLevel + '%';
      
      // Actualizar el gradiente del slider
      const percentage = zoomLevel;
      zoomSlider.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`;
    }
  }, [zoomLevel]);


  // Función para renderizar el grid en pantalla completa
  const renderGridInFullscreen = () => {
    const gridContent = document.getElementById('grid-fullscreen-content');
    if (!gridContent) return;

    // Solo limpiar y recrear si es necesario (evitar parpadeo)
    const existingGrid = gridContent.querySelector('.fullscreen-grid') as HTMLElement;
    const needsRecreation = !existingGrid || 
      existingGrid.style.gridTemplateColumns !== `repeat(${getGridColumns(viewMode)}, 1fr)`;

    if (needsRecreation) {
      // Limpiar contenido anterior
      gridContent.innerHTML = '';

      if (filteredCameras.length === 0) {
        gridContent.innerHTML = `
          <div style="text-align: center; padding: 48px 24px; color: #9ca3af;">
            <svg width="64" height="64" fill="currentColor" style="margin: 0 auto 16px; opacity: 0.5;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-2.5-2.5L7 16l3.5 3.5L17 13l-1.41-1.41L10 17z"/>
            </svg>
            <h3 style="font-size: 18px; margin: 0 0 8px 0;">No hay cámaras disponibles</h3>
            <p style="font-size: 14px; margin: 0;">Ajusta los filtros o agrega nuevas cámaras</p>
          </div>
        `;
        return;
      }

      // Calcular el número de columnas y el tamaño de las celdas
      const columns = getGridColumns(viewMode);
      const totalCameras = filteredCameras.length;
      const rows = Math.ceil(totalCameras / columns);
      
      // Crear el grid
      const grid = document.createElement('div');
      grid.className = 'fullscreen-grid';
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        grid-auto-rows: minmax(0, calc((100vw - 16px - ${(columns - 1) * 8}px) / ${columns} * 9 / 16));
        gap: 8px;
        width: 100%;
        max-width: 100%;
        height: fit-content;
        overflow: hidden;
        padding: 0;
        margin: 0;
        justify-content: center;
        align-content: center;
      `;

      // Renderizar cada cámara
      filteredCameras.forEach((camera) => {
        const cameraCard = createCameraCard(camera);
        grid.appendChild(cameraCard);
      });

      // Agregar el grid directamente al contenedor
      gridContent.appendChild(grid);
    } else {
      // Solo actualizar estados sin recrear elementos
      updateFullscreenCameraStates();
    }
  };

  // Función para actualizar solo los estados de las cámaras sin recrear elementos
  const updateFullscreenCameraStates = () => {
    filteredCameras.forEach((camera) => {
      const card = document.querySelector(`[data-camera-id="${camera.id}"]`);
      if (!card) return;

      // Actualizar indicadores de grabación
      const recordingIndicator = card.querySelector('.recording-indicator');
      const convertingIndicator = card.querySelector('.converting-indicator');
      
      if (recordingCameras[camera.id]) {
        if (!recordingIndicator) {
          const indicator = document.createElement('div');
          indicator.className = 'recording-indicator';
          indicator.style.cssText = `
            position: absolute;
            top: 48px;
            left: 12px;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 4px;
            background: #dc2626;
            padding: 4px 8px;
            border-radius: 12px;
            animation: pulse 2s infinite;
          `;
          indicator.innerHTML = `
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
            <span style="color: white; font-size: 10px; font-weight: 600;">REC</span>
          `;
          card.appendChild(indicator);
        }
      } else if (recordingIndicator) {
        recordingIndicator.remove();
      }

      if (convertingCameras[camera.id]) {
        if (!convertingIndicator) {
          const indicator = document.createElement('div');
          indicator.className = 'converting-indicator';
          indicator.style.cssText = `
            position: absolute;
            top: 48px;
            right: 12px;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 4px;
            background: #2563eb;
            padding: 4px 8px;
            border-radius: 12px;
          `;
          indicator.innerHTML = `
            <div style="width: 8px; height: 8px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span style="color: white; font-size: 10px; font-weight: 600;">Convirtiendo...</span>
          `;
          card.appendChild(indicator);
        }
      } else if (convertingIndicator) {
        convertingIndicator.remove();
      }

      // Actualizar tiempo
      const timeElement = card.querySelector('.camera-time');
      if (timeElement) {
        timeElement.textContent = formatTime(currentTime);
      }

      const dateElement = card.querySelector('.camera-date');
      if (dateElement) {
        dateElement.textContent = formatDate(currentTime);
      }

      // Actualizar botón de grabación en controles
      const recordButton = card.querySelector('button');
      if (recordButton) {
        const isRecording = recordingCameras[camera.id];
        recordButton.style.background = isRecording 
          ? '#dc2626' 
          : ffmpegLoaded 
            ? 'rgba(0,0,0,0.7)' 
            : '#6b7280';
        
        if (isRecording) {
          recordButton.style.animation = 'pulse 2s infinite';
        } else {
          recordButton.style.animation = 'none';
        }
        
        recordButton.innerHTML = isRecording 
          ? '<svg width="16" height="16" fill="white"><rect width="8" height="8" x="4" y="4" rx="1"/></svg>'
          : '<svg width="16" height="16" fill="white"><circle cx="8" cy="8" r="6"/></svg>';
      }

      // Actualizar stream si es necesario (cada 30 segundos)
      if (camera.status === 'active') {
        const img = card.querySelector('img');
        if (img) {
          const currentTimestamp = Math.floor(Date.now() / 30000) * 30000;
          const currentSrc = img.src;
          const newSrc = `${camera.streamUrl}?t=${currentTimestamp}`;
          
          if (!currentSrc.includes(currentTimestamp.toString())) {
            // Solo actualizar si el timestamp ha cambiado
            img.style.opacity = '0';
            img.onload = () => {
              img.style.opacity = '1';
            };
            img.src = newSrc;
          }
        }
      }
    });
  };

  // Función para obtener el número de columnas del grid
  const getGridColumns = (mode: ViewMode) => {
    switch (mode) {
      case '1x1': return 1;
      case '2x2': return 2;
      case '3x3': return 3;
      case '4x4': return 4;
      case '1x4': return 4;
      case '1x8': return 8;
      case '2x3': return 3;
      case '3x2': return 2;
      case '4x2': return 2;
      case '6x1': return 6;
      default: return 2;
    }
  };

  // Función para crear una tarjeta de cámara
  const createCameraCard = (camera: Camera) => {
    const card = document.createElement('div');
    card.setAttribute('data-camera-id', camera.id);
    card.style.cssText = `
      position: relative;
      background: #1f2937;
      border-radius: 6px;
      border: 1px solid #374151;
      overflow: hidden;
      width: 100%;
      aspect-ratio: 16/9;
      transition: all 0.2s;
      min-height: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
    `;

    // Header de la cámara
    const header = document.createElement('div');
    header.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
      padding: 12px;
      z-index: 10;
    `;

    const headerContent = document.createElement('div');
    headerContent.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    `;

    const statusBadge = document.createElement('div');
    statusBadge.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
      ${getStatusColor(camera.status)}
    `;
    statusBadge.innerHTML = `
      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
        ${getStatusIconSvg(camera.status)}
      </svg>
      ${camera.status}
    `;

    headerContent.appendChild(statusBadge);
    header.appendChild(headerContent);

    // Stream de la cámara
    const streamContainer = document.createElement('div');
    streamContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: black;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    if (camera.status === 'active') {
      const img = document.createElement('img');
      // Usar un timestamp estable para evitar parpadeo en pantalla completa
      const stableTimestamp = Math.floor(Date.now() / 30000) * 30000; // Actualizar cada 30 segundos
      img.src = `${camera.streamUrl}?t=${stableTimestamp}`;
      img.alt = camera.name;
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      img.onerror = () => {
        img.style.display = 'none';
      };
      img.onload = () => {
        img.style.opacity = '1';
      };
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
      streamContainer.appendChild(img);
      } else {
      streamContainer.innerHTML = `
        <div style="text-align: center; color: #6b7280;">
          <svg width="32" height="32" fill="currentColor" style="margin: 0 auto 8px; opacity: 0.5;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-2.5-2.5L7 16l3.5 3.5L17 13l-1.41-1.41L10 17z"/>
          </svg>
          <p style="font-size: 12px; margin: 0;">Cámara ${camera.status}</p>
        </div>
      `;
    }

    // Footer con información
    const footer = document.createElement('div');
    footer.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      padding: 12px;
    `;

    const footerContent = document.createElement('div');
    footerContent.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    `;

    const cameraInfo = document.createElement('div');
    cameraInfo.innerHTML = `
      <h3 style="font-size: 14px; font-weight: 600; margin: 0; color: white;">${camera.name}</h3>
      <p style="font-size: 12px; color: #9ca3af; margin: 2px 0 0 0;">${camera.description}</p>
    `;

    const timeInfo = document.createElement('div');
    timeInfo.style.cssText = `
      text-align: right;
      color: white;
    `;
    timeInfo.innerHTML = `
      <div class="camera-time" style="font-size: 12px; font-family: monospace;">${formatTime(currentTime)}</div>
      <div class="camera-date" style="font-size: 10px; color: #9ca3af;">${formatDate(currentTime)}</div>
    `;

    footerContent.appendChild(cameraInfo);
    footerContent.appendChild(timeInfo);
    footer.appendChild(footerContent);

    // Overlay de controles
    const controlsOverlay = document.createElement('div');
    controlsOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    `;

    card.addEventListener('mouseenter', () => {
      controlsOverlay.style.opacity = '1';
    });

    card.addEventListener('mouseleave', () => {
      controlsOverlay.style.opacity = '0';
    });

    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    // Botón de maximizar
    const maximizeButton = document.createElement('button');
    maximizeButton.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(12px);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      color: rgba(255,255,255,0.9);
    `;
    maximizeButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
    maximizeButton.title = 'Maximizar cámara';

    // Event listeners
    maximizeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      maximizeCamera(camera);
    });

    // Efectos hover profesionales
    maximizeButton.addEventListener('mouseenter', () => {
      maximizeButton.style.background = 'rgba(0,0,0,0.85)';
      maximizeButton.style.borderColor = 'rgba(255,255,255,0.2)';
      maximizeButton.style.color = 'rgba(255,255,255,1)';
      maximizeButton.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6)';
      maximizeButton.style.transform = 'translateY(-1px)';
    });

    maximizeButton.addEventListener('mouseleave', () => {
      maximizeButton.style.background = 'rgba(0,0,0,0.75)';
      maximizeButton.style.borderColor = 'rgba(255,255,255,0.1)';
      maximizeButton.style.color = 'rgba(255,255,255,0.9)';
      maximizeButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
      maximizeButton.style.transform = 'translateY(0)';
    });

    controls.appendChild(maximizeButton);
    controlsOverlay.appendChild(controls);

    // Ensamblar tarjeta
    card.appendChild(header);
    card.appendChild(streamContainer);
    card.appendChild(footer);
    card.appendChild(controlsOverlay);

    // Indicador de grabación
    if (recordingCameras[camera.id]) {
      const recordingIndicator = document.createElement('div');
      recordingIndicator.style.cssText = `
        position: absolute;
        top: 48px;
        left: 12px;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 4px;
        background: #dc2626;
        padding: 4px 8px;
        border-radius: 12px;
        animation: pulse 2s infinite;
      `;
      recordingIndicator.innerHTML = `
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        <span style="color: white; font-size: 10px; font-weight: 600;">REC</span>
      `;
      card.appendChild(recordingIndicator);
    }

    // Indicador de conversión
    if (convertingCameras[camera.id]) {
      const convertingIndicator = document.createElement('div');
      convertingIndicator.style.cssText = `
        position: absolute;
        top: 48px;
        right: 12px;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 4px;
        background: #2563eb;
        padding: 4px 8px;
        border-radius: 12px;
      `;
      convertingIndicator.innerHTML = `
        <div style="width: 8px; height: 8px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span style="color: white; font-size: 10px; font-weight: 600;">Convirtiendo...</span>
      `;
      card.appendChild(convertingIndicator);
    }

    return card;
  };

  // Limpiar grabaciones al desmontar
  useEffect(() => {
    return () => {
      // Limpiar grabaciones de cámaras
      Object.keys(recordingRef.current).forEach(cameraId => {
        const recording = recordingRef.current[cameraId];
        if (recording) {
          recording.isRecording = false;
          if (recording.intervalId) {
            clearInterval(recording.intervalId);
          }
          // Limpiar URLs de frames
          recording.frames.forEach(frameUrl => URL.revokeObjectURL(frameUrl));
        }
      });
      
      // Limpiar grabación de pantalla
      if (screenRecorder && screenRecorder.state === 'recording') {
        screenRecorder.stop();
        screenRecorder.stream.getTracks().forEach(track => track.stop());
      }
      
      // Limpiar pantalla completa
      const fullscreenElement = document.getElementById('fullscreen-camera-container');
      if (fullscreenElement) {
        document.body.removeChild(fullscreenElement);
      }
      
      // Limpiar grid en pantalla completa
      const gridFullscreenElement = document.getElementById('grid-fullscreen-container');
      if (gridFullscreenElement) {
        document.body.removeChild(gridFullscreenElement);
      }
      
      document.body.style.overflow = 'auto';
    };
  }, [screenRecorder]);

  // Filtrar y ordenar cámaras
  const filteredCameras = cameras
    .filter(camera => {
      const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           camera.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || camera.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Renderizar grid en pantalla completa cuando cambien las cámaras o el modo de vista
  useEffect(() => {
    if (isGridFullscreen) {
      renderGridInFullscreen();
    }
  }, [filteredCameras, viewMode]);

  // Actualizar estados de cámaras en pantalla completa sin recrear elementos
  useEffect(() => {
    if (isGridFullscreen) {
      updateFullscreenCameraStates();
    }
  }, [currentTime, recordingCameras, convertingCameras, isGridFullscreen]);

  const getGridClasses = (mode: ViewMode) => {
    switch (mode) {
      case '1x1': return 'grid-cols-1';
      case '2x2': return 'grid-cols-2';
      case '3x3': return 'grid-cols-3';
      case '4x4': return 'grid-cols-4';
      case '1x4': return 'grid-cols-4';
      case '1x8': return 'grid-cols-8';
      case '2x3': return 'grid-cols-3';
      case '3x2': return 'grid-cols-2';
      case '4x2': return 'grid-cols-2';
      case '6x1': return 'grid-cols-6';
      default: return 'grid-cols-2';
    }
  };

  const getAspectRatio = (mode: ViewMode) => {
    switch (mode) {
      case '1x1': return 'aspect-square';
      case '2x2': return 'aspect-video';
      case '3x3': return 'aspect-video';
      case '4x4': return 'aspect-square';
      case '1x4': return 'aspect-video';
      case '1x8': return 'aspect-video';
      case '2x3': return 'aspect-video';
      case '3x2': return 'aspect-video';
      case '4x2': return 'aspect-video';
      case '6x1': return 'aspect-video';
      default: return 'aspect-video';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'inactive': return 'text-yellow-400 bg-yellow-400/20';
      case 'maintenance': return 'text-blue-400 bg-blue-400/20';
      case 'offline': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3" />;
      case 'inactive': return <AlertCircle className="w-3 h-3" />;
      case 'maintenance': return <Settings className="w-3 h-3" />;
      case 'offline': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusIconSvg = (status: string) => {
    switch (status) {
      case 'active': return '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>';
      case 'inactive': return '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>';
      case 'maintenance': return '<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>';
      case 'offline': return '<path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>';
      default: return '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-xl mb-4">Cargando centro de monitoreo...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div className={`min-h-screen bg-gray-900 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* Banner de grabación de pantalla */}
        {isScreenRecording && (
          <div className="bg-red-600 text-white py-2 px-4 text-center animate-pulse">
            <div className="flex items-center justify-center space-x-2">
              <Circle className="w-3 h-3 fill-white" />
              <span className="font-semibold">GRABACIÓN DE PANTALLA ACTIVA</span>
              <span className="text-sm opacity-90">- Presiona el botón de stop para finalizar</span>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0">
              <Link href="/admin/admin-dashboard" className="flex items-center space-x-1 sm:space-x-2 text-gray-300 hover:text-white transition-colors flex-shrink-0">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base hidden sm:inline">Volver</span>
              </Link>
              <div className="h-4 sm:h-6 w-px bg-gray-600 hidden sm:block"></div>
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Centro de Monitoreo</h1>
                
                {/* Indicador de grabación de pantalla */}
                {isScreenRecording && (
                  <div className="flex items-center space-x-1 sm:space-x-2 bg-red-600 px-2 sm:px-3 py-1 rounded-full animate-pulse ml-2 sm:ml-3">
                    <Circle className="w-2 h-2 sm:w-3 sm:h-3 fill-white" />
                    <span className="text-white text-[10px] sm:text-xs font-semibold hidden sm:inline">GRABANDO PANTALLA</span>
                    <span className="text-white text-[10px] sm:text-xs font-semibold sm:hidden">REC</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
              {/* Tiempo actual */}
              <div className="text-right hidden md:block">
                <div className="text-lg font-mono">{formatTime(currentTime)}</div>
                <div className="text-sm text-gray-400">{formatDate(currentTime)}</div>
              </div>
              
              {/* Tiempo actual móvil */}
              <div className="text-right md:hidden">
                <div className="text-sm sm:text-base font-mono">{formatTime(currentTime)}</div>
              </div>
              
              
              {/* Controles */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Botón de grabación de pantalla */}
                <button
                  onClick={isScreenRecording ? stopScreenRecording : startScreenRecording}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    isScreenRecording 
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isScreenRecording ? 'Detener grabación de pantalla' : 'Grabar pantalla'}
                >
                  {isScreenRecording ? (
                    <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  ) : (
                    <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
                
                <button
                  onClick={() => setMuted(!muted)}
                  className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title={muted ? 'Activar sonido' : 'Silenciar'}
                >
                  {muted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                
                <button
                  onClick={maximizeGrid}
                  className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors hidden sm:block"
                  title="Maximizar grid de cámaras"
                >
                  <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Vista */}
        <div className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide">
              {/* Modos de vista */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Vista:</span>
                <div className="flex space-x-1">
                  {[
                    { mode: '1x1', icon: Maximize2, label: '1x1', hideMobile: false },
                    { mode: '2x2', icon: Grid2X2, label: '2x2', hideMobile: false },
                    { mode: '3x3', icon: Grid3X3, label: '3x3', hideMobile: true },
                    { mode: '4x4', icon: Grid3X3, label: '4x4', hideMobile: true },
                    { mode: '1x4', icon: Layout, label: '1x4', hideMobile: true },
                    { mode: '1x8', icon: Layout, label: '1x8', hideMobile: true }
                  ].map(({ mode, icon: Icon, label, hideMobile }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as ViewMode)}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${hideMobile ? 'hidden md:block' : ''} ${
                        viewMode === mode 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      title={label}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial overflow-x-auto">
                <div className="relative min-w-[100px] flex-1 sm:flex-initial sm:w-auto">
                  <Search className="w-3 h-3 sm:w-4 sm:h-4 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                  <option value="maintenance">Mant.</option>
                  <option value="offline">Offline</option>
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as SortBy);
                    setSortOrder(order as SortOrder);
                  }}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs sm:text-sm hidden md:block"
                >
                  <option value="name-asc">Nombre A-Z</option>
                  <option value="name-desc">Nombre Z-A</option>
                  <option value="status-asc">Estado A-Z</option>
                  <option value="status-desc">Estado Z-A</option>
                  <option value="createdAt-desc">Más recientes</option>
                  <option value="createdAt-asc">Más antiguos</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={loadCameras}
                className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              
              <div className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                {filteredCameras.length} de {cameras.length} cámaras
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Cámaras */}
        <div className="p-3 sm:p-4 md:p-6">
          {filteredCameras.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl text-gray-400 mb-2">No hay cámaras disponibles</h3>
              <p className="text-sm sm:text-base text-gray-500">Ajusta los filtros o agrega nuevas cámaras</p>
            </div>
          ) : (
            <div className={`grid ${getGridClasses(viewMode)} gap-2 sm:gap-3 md:gap-4`}>
              {filteredCameras.map((camera) => (
                <div
                  key={camera.id}
                  className={`relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden group hover:border-gray-600 transition-all ${getAspectRatio(viewMode)}`}
                >
                  {/* Header de la cámara */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-2 sm:p-3 z-10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <div className={`flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs ${getStatusColor(camera.status)}`}>
                          {getStatusIcon(camera.status)}
                          <span className="capitalize hidden sm:inline">{camera.status}</span>
                        </div>
                        <div className="flex items-center space-x-0.5 sm:space-x-1 text-[10px] sm:text-xs text-gray-300">
                          <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="hidden sm:inline">En línea</span>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 bg-black/50 rounded transition-opacity hidden sm:block">
                        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stream de la cámara */}
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    {camera.status === 'active' ? (
                      <img
                        src={`${camera.streamUrl}?t=${Date.now()}`}
                        alt={camera.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <Camera className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm">Cámara {camera.status}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer con información */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-white text-xs sm:text-sm truncate">{camera.name}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-400 truncate hidden sm:block">{camera.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] sm:text-xs text-gray-300 font-mono">{formatTime(currentTime)}</div>
                        <div className="text-[9px] sm:text-xs text-gray-400 hidden sm:block">{formatDate(currentTime)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Overlay de controles */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 hidden sm:flex">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => toggleRecording(camera.id, camera.name)}
                        disabled={!ffmpegLoaded}
                        className={`p-3 rounded-full hover:bg-black/70 transition-all ${
                          recordingCameras[camera.id] 
                            ? 'bg-red-600 animate-pulse' 
                            : ffmpegLoaded 
                              ? 'bg-black/50' 
                              : 'bg-gray-600 cursor-not-allowed'
                        }`}
                        title={
                          !ffmpegLoaded 
                            ? 'Cargando FFmpeg...' 
                            : recordingCameras[camera.id] 
                              ? 'Detener grabación' 
                              : 'Iniciar grabación'
                        }
                      >
                        {recordingCameras[camera.id] ? (
                          <Square className="w-4 h-4 fill-white" />
                        ) : (
                          <Circle className={`w-4 h-4 ${ffmpegLoaded ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                        )}
                      </button>
                      <button 
                        onClick={() => maximizeCamera(camera)}
                        className="p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                        title="Maximizar cámara"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Indicador de grabación */}
                  {recordingCameras[camera.id] && (
                    <div className="absolute top-12 sm:top-14 left-2 sm:left-3 z-10 flex items-center space-x-1 sm:space-x-2 bg-red-600 px-2 sm:px-3 py-1 rounded-full animate-pulse">
                      <Circle className="w-2 h-2 sm:w-3 sm:h-3 fill-white" />
                      <span className="text-white text-[10px] sm:text-xs font-semibold">REC</span>
                    </div>
                  )}
                  
                  {/* Indicador de conversión */}
                  {convertingCameras[camera.id] && (
                    <div className="absolute top-12 sm:top-14 right-2 sm:right-3 z-10 flex items-center space-x-1 sm:space-x-2 bg-blue-600 px-2 sm:px-3 py-1 rounded-full">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-white text-[10px] sm:text-xs font-semibold">Convirtiendo...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estilos CSS para animaciones */}
        <style jsx global>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
};

export default MonitoringPage;
