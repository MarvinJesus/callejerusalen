'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AdminPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a /admin/admin-dashboard
    router.replace('/admin/admin-dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al panel de administración...</p>
      </div>
    </div>
  );
};

export default AdminPage;