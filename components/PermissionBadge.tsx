'use client';

import React from 'react';
import { Permission, PERMISSION_DESCRIPTIONS, getPermissionGroup } from '@/lib/permissions';
import { Shield, Users, Settings, Eye, FileText, BarChart3, Camera, Bell } from 'lucide-react';

interface PermissionBadgeProps {
  permission: Permission;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error';
}

const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  permission,
  showDescription = false,
  size = 'md',
  variant = 'default'
}) => {
  const getPermissionIcon = (permission: Permission) => {
    if (permission.startsWith('users.')) return Users;
    if (permission.startsWith('roles.') || permission.startsWith('permissions.')) return Shield;
    if (permission.startsWith('system.')) return Settings;
    if (permission.startsWith('security.')) return Camera;
    if (permission.startsWith('reports.') || permission.startsWith('analytics.')) return BarChart3;
    if (permission.startsWith('logs.')) return FileText;
    if (permission.startsWith('registrations.')) return Eye;
    if (permission.startsWith('community.')) return Bell;
    return Shield;
  };

  const getVariantStyles = (variant: string) => {
    const styles = {
      default: 'bg-gray-100 text-gray-800 border-gray-200',
      outline: 'bg-white text-gray-700 border-gray-300',
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[variant as keyof typeof styles] || styles.default;
  };

  const getSizeStyles = (size: string) => {
    const styles = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base'
    };
    return styles[size as keyof typeof styles] || styles.md;
  };

  const Icon = getPermissionIcon(permission);
  const group = getPermissionGroup(permission);
  const description = PERMISSION_DESCRIPTIONS[permission];

  return (
    <div className="inline-flex items-center space-x-2">
      <span
        className={`inline-flex items-center space-x-1 border rounded-full font-medium ${getVariantStyles(variant)} ${getSizeStyles(size)}`}
        title={showDescription ? undefined : description}
      >
        <Icon className="w-3 h-3" />
        <span>{permission}</span>
      </span>
      {showDescription && (
        <span className="text-xs text-gray-500 max-w-xs truncate">
          {description}
        </span>
      )}
    </div>
  );
};

interface PermissionListProps {
  permissions: Permission[];
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error';
  maxVisible?: number;
  groupBy?: boolean;
}

export const PermissionList: React.FC<PermissionListProps> = ({
  permissions,
  showDescription = false,
  size = 'sm',
  variant = 'default',
  maxVisible = 5,
  groupBy = false
}) => {
  const [showAll, setShowAll] = React.useState(false);

  if (permissions.length === 0) {
    return (
      <span className="text-sm text-gray-500 italic">
        Sin permisos asignados
      </span>
    );
  }

  const visiblePermissions = showAll ? permissions : permissions.slice(0, maxVisible);
  const hasMore = permissions.length > maxVisible;

  if (groupBy) {
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const group = getPermissionGroup(permission) || 'other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return (
      <div className="space-y-2">
        {Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
          <div key={group}>
            <div className="text-xs font-medium text-gray-500 mb-1 capitalize">
              {group.replace('_', ' ')}
            </div>
            <div className="flex flex-wrap gap-1">
              {groupPermissions.map(permission => (
                <PermissionBadge
                  key={permission}
                  permission={permission}
                  showDescription={showDescription}
                  size={size}
                  variant={variant}
                />
              ))}
            </div>
          </div>
        ))}
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Ver {permissions.length - maxVisible} más...
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {visiblePermissions.map(permission => (
        <PermissionBadge
          key={permission}
          permission={permission}
          showDescription={showDescription}
          size={size}
          variant={variant}
        />
      ))}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1"
        >
          +{permissions.length - maxVisible} más
        </button>
      )}
      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
        >
          Ver menos
        </button>
      )}
    </div>
  );
};

export default PermissionBadge;
