import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamUrl = searchParams.get('url');
    
    if (!streamUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validar que la URL sea HTTP (no HTTPS para evitar bucles)
    if (!streamUrl.startsWith('http://')) {
      return NextResponse.json({ error: 'Only HTTP URLs are allowed' }, { status: 400 });
    }

    // Validar dominios permitidos (opcional, para seguridad)
    const allowedHosts = [
      '77.222.181.11',
      '24.35.236.133', 
      '67.53.46.161',
      '200.107.234.131',
      '80.28.111.68',  // Nueva cámara agregada
      '50.199.215.189',
      '145.238.185.10',
      '97.68.79.162',
      '155.31.14.42',
      '162.17.65.121',
      '75.112.36.194',
      '206.40.97.180',
      '192.168.',
      '10.',
      '172.'
    ];

    const urlObj = new URL(streamUrl);
    const isAllowed = allowedHosts.some(host => 
      urlObj.hostname.includes(host) || 
      urlObj.hostname.startsWith(host)
    );

    if (!isAllowed) {
      console.warn(`🚫 Host no permitido: ${urlObj.hostname} para URL: ${streamUrl}`);
      return NextResponse.json({ 
        error: 'Host not allowed', 
        hostname: urlObj.hostname,
        message: 'Esta IP de cámara no está en la lista de hosts permitidos. Contacta al administrador para agregarla.'
      }, { status: 403 });
    }

    console.log(`✅ Host permitido: ${urlObj.hostname} para URL: ${streamUrl}`);

    // Hacer la petición al stream HTTP
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StreamProxy/1.0)',
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
      // Configurar timeout
      signal: AbortSignal.timeout(30000), // 30 segundos
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Stream not available' }, { status: response.status });
    }

    // Obtener el tipo de contenido
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Crear respuesta con el stream
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body?.getReader();
        
        if (!reader) {
          controller.close();
          return;
        }

        function pump(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }

        return pump();
      }
    });

    // Retornar el stream con headers apropiados
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Headers específicos para streams
        'X-Accel-Buffering': 'no', // Deshabilitar buffering en Nginx
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Manejar preflight requests para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
