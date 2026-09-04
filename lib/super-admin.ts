const DEFAULT_SUPER_ADMIN_EMAIL = 'mar90jesus@gmail.com';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/^["']+|["']+$/g, '');
}

export function getSuperAdminEmail(): string {
  const fromEnv = (
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ||
    process.env.SUPER_ADMIN_EMAIL ||
    ''
  );

  return normalizeEmail(fromEnv || DEFAULT_SUPER_ADMIN_EMAIL);
}

export function isMainSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return normalizeEmail(email) === getSuperAdminEmail();
}

export function getAuthEmails(user?: {
  email?: string | null;
  providerData?: Array<{ email?: string | null }>;
} | null): string[] {
  if (!user) return [];
  return [user.email, ...(user.providerData || []).map((provider) => provider.email)]
    .filter((email): email is string => Boolean(email));
}

export function authUserIsMainSuperAdmin(user?: {
  email?: string | null;
  providerData?: Array<{ email?: string | null }>;
} | null): boolean {
  return getAuthEmails(user).some(isMainSuperAdmin);
}
