/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de headers para UTF-8 y seguridad
  async headers() {
    return [
      {
        source: '/((?!.*\\.).*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/html; charset=utf-8',
          },
          // Permitir contenido mixto solo en desarrollo para cámaras de seguridad
          ...(process.env.NODE_ENV === 'development' ? [
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self'; img-src 'self' data: http: https:; connect-src 'self' http: https: ws: wss:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
            }
          ] : [])
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      // Permitir URLs de cámaras de seguridad HTTP para desarrollo
      {
        protocol: 'http',
        hostname: '77.222.181.11',
        port: '8080',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '24.35.236.133',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '67.53.46.161',
        port: '65123',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '200.107.234.131',
        port: '',
        pathname: '/**',
      },
      // Permitir cualquier IP local para cámaras
      {
        protocol: 'http',
        hostname: '192.168.*',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '10.*',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Configuración para Firebase
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      buffer: false,
      util: false,
    };

    // Configuración específica para Firebase
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'firebase/app': 'commonjs firebase/app',
        'firebase/auth': 'commonjs firebase/auth',
        'firebase/firestore': 'commonjs firebase/firestore',
        'firebase/analytics': 'commonjs firebase/analytics',
      });
    }

    return config;
  },
  transpilePackages: ['firebase'],
  experimental: {
    esmExternals: false,
  },
};

export default nextConfig;
