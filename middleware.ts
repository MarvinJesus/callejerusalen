import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Obtener la ruta actual
  const { pathname } = request.nextUrl;

  // Rutas que requieren autenticación
  const protectedRoutes = [
    '/visitantes',
    '/residentes', // Mantener rutas existentes por compatibilidad
    '/admin'
  ];

  // Rutas de administración que requieren rol de super_admin
  const adminRoutes = ['/admin'];

  // Verificar si la ruta está protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // En una implementación real, aquí verificarías el token JWT
    // o las cookies de autenticación. Por ahora, solo redirigimos
    // si es una ruta de admin sin autenticación.
    
    if (isAdminRoute) {
      // Para rutas de admin, verificar que el usuario tenga rol de super_admin
      // Esto se manejará en el componente de la página
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

