/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de headers para UTF-8
  async headers() {
    return [
      {
        source: '/((?!.*\\.).*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/html; charset=utf-8',
          },
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
