'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { isMainSuperAdmin, authUserIsMainSuperAdmin } from '@/lib/super-admin';

const AdminPage: React.FC = () => {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const canEnterAdmin =
      userProfile?.role === 'super_admin' ||
      userProfile?.role === 'admin' ||
      isMainSuperAdmin(userProfile?.email) ||
      authUserIsMainSuperAdmin(user);

    if (canEnterAdmin) {
      router.replace('/admin/admin-dashboard');
    }
  }, [loading, user, userProfile, router]);

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo al panel de administración...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;
