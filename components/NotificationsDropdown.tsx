'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { AppNotification, useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

const formatRelativeTime = (date: Date): string => {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 45) {
    return 'Hace unos segundos';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? 'Hace 1 minuto' : `Hace ${diffMinutes} minutos`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return diffDays === 1 ? 'Hace 1 día' : `Hace ${diffDays} días`;
  }

  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTypeLabel = (type: string): string => {
  if (!type) {
    return 'general';
  }

  return type
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
};

const getNotificationVisuals = (type: string) => {
  switch (type) {
    case 'registration_welcome':
      return {
        icon: Sparkles,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        ringColor: 'ring-amber-100'
      };
    case 'registration_approved':
      return {
        icon: ShieldCheck,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        ringColor: 'ring-emerald-100'
      };
    case 'registration_rejected':
      return {
        icon: AlertCircle,
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        ringColor: 'ring-rose-100'
      };
    case 'panic_alert_active':
      return {
        icon: AlertTriangle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        ringColor: 'ring-red-100'
      };
    case 'panic_alert_resolved':
      return {
        icon: CheckCircle2,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        ringColor: 'ring-emerald-100'
      };
    case 'camera_access_approved':
      return {
        icon: CheckCircle2,
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        ringColor: 'ring-sky-100'
      };
    default:
      return {
        icon: Info,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-600',
        ringColor: 'ring-slate-100'
      };
  }
};

const normalizePossibleDate = (value: unknown): Date => {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const maybeTimestamp = value as { toDate: () => Date };
      return maybeTimestamp.toDate();
    } catch {
      return new Date();
    }
  }

  return new Date();
};

const formatMetadataKey = (key: string): string => {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
};

const formatMetadataValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date || value instanceof Timestamp || (typeof value === 'object' && value !== null && 'toDate' in (value as Record<string, unknown>))) {
    return normalizePossibleDate(value).toLocaleString('es-MX');
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'string') {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toLocaleString('es-MX');
    }
    return value;
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  }

  return String(value);
};

const NotificationsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead
  } = useNotifications({ limit: 25 });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOpen]);

  useEffect(() => {
    if (!selectedNotification) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedNotification(null);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [selectedNotification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const badgeContent = useMemo(() => {
    if (unreadCount > 99) {
      return '99+';
    }

    return unreadCount.toString();
  }, [unreadCount]);

  const handleOpenNotification = async (notification: AppNotification) => {
    await markAsRead(notification.id);
    setIsOpen(false);
    setSelectedNotification(notification);
  };

  const handleCloseModal = () => {
    setSelectedNotification(null);
  };

  const handleNavigate = () => {
    if (selectedNotification?.link) {
      router.push(selectedNotification.link);
      setSelectedNotification(null);
    }
  };

  const handleMarkAll = async () => {
    if (!unreadCount) {
      return;
    }

    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-all duration-200 hover:border-primary-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        title="Notificaciones"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell className={`w-5 h-5 ${unreadCount ? 'text-primary-600' : 'text-gray-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-1.5 text-xs font-semibold text-white shadow-sm">
            {badgeContent}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />

          <div className="notifications-dropdown absolute mt-2 w-[calc(100vw-1rem)] sm:w-96 sm:right-0 sm:left-auto left-1/2 transform -translate-x-1/2 sm:transform-none max-w-[95vw] overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-2xl z-[101] sm:max-w-none">
            <div className="flex items-center justify-between gap-3 border-b border-white/20 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 px-3 sm:px-5 py-3 sm:py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wide">Centro de notificaciones</p>
                  <p className="text-[11px] text-white/80">
                    {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al dia'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={!unreadCount || isMarkingAll}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-white shadow-sm transition hover:bg-white/25 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/60"
              >
                {isMarkingAll ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Marcando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Marcar todas</span>
                  </>
                )}
              </button>
            </div>

            <div className="max-h-80 sm:max-h-96 overflow-y-auto">
              {loading && (
                <div className="space-y-3 p-3 sm:p-5">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/2 rounded-full bg-gray-200" />
                          <div className="h-3 w-3/4 rounded-full bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-rose-600">No se pudieron cargar las notificaciones</p>
                  <p className="mt-1 text-xs text-rose-500">Intenta nuevamente en unos segundos.</p>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                    <UserPlus className="h-7 w-7 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-800">No hay notificaciones</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Aqui apareceran los avisos importantes cuando suceda algo nuevo.
                  </p>
                </div>
              )}

              {!loading && !error && notifications.length > 0 && (
                <ul className="space-y-3 p-3 sm:p-4">
                  {notifications.map((notification) => {
                    const visuals = getNotificationVisuals(notification.type);
                    const IconComponent = visuals.icon;
                    const typeLabel = formatTypeLabel(notification.type);
                    const previewMessage =
                      notification.message && notification.message.length > 160
                        ? `${notification.message.slice(0, 160)}...`
                        : notification.message;

                    return (
                      <li key={notification.id} className="group">
                        <button
                          type="button"
                          onClick={() => handleOpenNotification(notification)}
                          className={`w-full rounded-2xl border text-left transition-all duration-200 ${
                            notification.read
                              ? 'border-gray-100 bg-white hover:shadow-md'
                              : `border-transparent bg-white shadow-md ring-1 ${visuals.ringColor} hover:shadow-lg`
                          }`}
                        >
                          <div className="flex items-start gap-3 px-3 sm:px-4 py-3 sm:py-4">
                            <div
                              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${visuals.iconBg}`}
                            >
                              <IconComponent className={`h-5 w-5 ${visuals.iconColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">{notification.title}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-right">
                                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    {formatRelativeTime(notification.createdAt)}
                                  </span>
                                  <span className="inline-flex max-w-[140px] items-center justify-end rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                                    <span className="truncate">{typeLabel}</span>
                                  </span>
                                </div>
                              </div>

                              {previewMessage && (
                                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{previewMessage}</p>
                              )}

                              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600">
                                Ver detalle
                                <ExternalLink className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>

    {selectedNotification && (
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4"
        onClick={handleCloseModal}
        style={{ margin: 0, padding: 0 }}
      >
        <div
          className="relative w-full max-w-lg rounded-3xl bg-white p-4 sm:p-6 shadow-2xl mx-4 sm:mx-0"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleCloseModal}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>

          {(() => {
            const visuals = getNotificationVisuals(selectedNotification.type);
            const IconComponent = visuals.icon;
            return (
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${visuals.iconBg}`}
                >
                  <IconComponent className={`h-6 w-6 ${visuals.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-900">{selectedNotification.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span className="font-semibold text-slate-500">
                      {formatTypeLabel(selectedNotification.type)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{formatRelativeTime(selectedNotification.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {selectedNotification.message && (
            <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{selectedNotification.message}</p>
          )}

          {selectedNotification.data &&
            typeof selectedNotification.data === 'object' &&
            Object.keys(selectedNotification.data).length > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Detalles adicionales
                </h4>
                <dl className="mt-3 space-y-2">
                  {Object.entries(selectedNotification.data as Record<string, unknown>).map(([key, value]) => {
                    const formatted = formatMetadataValue(value);
                    if (!formatted) {
                      return null;
                    }
                    return (
                      <div key={key} className="flex items-start justify-between gap-4 text-sm text-slate-600">
                        <dt className="font-medium text-slate-700">{formatMetadataKey(key)}</dt>
                        <dd className="max-w-[60%] whitespace-pre-wrap text-right text-slate-600">{formatted}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}

          <div className="mt-4 sm:mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCloseModal}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
            >
              Cerrar
            </button>
            {selectedNotification.link && (
              <button
                type="button"
                onClick={handleNavigate}
                className="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
              >
                Abrir sección
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default NotificationsDropdown;


