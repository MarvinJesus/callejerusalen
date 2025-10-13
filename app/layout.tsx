import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './themes.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { GlobalAlertProvider } from '@/context/GlobalAlertContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { Toaster } from 'react-hot-toast';
import FloatingHomeButton from '@/components/FloatingHomeButton';
import FloatingPanicButton from '@/components/FloatingPanicButton';
import GlobalRegistrationAlert from '@/components/GlobalRegistrationAlert';
import GlobalAlertBanner from '@/components/GlobalAlertBanner';
import PanicNotificationSystem from '@/components/PanicNotificationSystem';
import PanicAlertModal from '@/components/PanicAlertModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Calle Jerusalén - Comunidad Digital',
  description: 'Plataforma comunitaria para residentes y visitantes de Calle Jerusalén',
  keywords: 'comunidad, seguridad, servicios, lugares, Calle Jerusalén',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={inter.className} data-theme="default">
        <ThemeProvider>
          <GlobalAlertProvider>
            {/* Banner Global - Nivel más alto para que sea visible en TODAS las páginas */}
            <GlobalAlertBanner />
            
            <AuthProvider>
              {/* WebSocket Provider - Conecta al servidor de tiempo real */}
              <WebSocketProvider>
                <GlobalRegistrationAlert />
                
                {/* Sistema de notificaciones de pánico dual:
                    - PanicAlertModal: WebSocket en tiempo real (prioridad)
                    - PanicNotificationSystem: Firestore fallback */}
                <PanicAlertModal />
                <PanicNotificationSystem />
                
                <div className="relative">
                  {children}
                </div>
                <FloatingHomeButton />
                <FloatingPanicButton />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#4ade80',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </WebSocketProvider>
            </AuthProvider>
          </GlobalAlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

