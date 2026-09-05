import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';
import { isMainSuperAdmin, getSuperAdminEmail } from '@/lib/super-admin';
import { ALL_PERMISSIONS } from '@/lib/permissions';

const ROLE_RANK: Record<string, number> = {
  visitante: 1,
  comunidad: 2,
  admin: 3,
  super_admin: 4,
};

function toIso(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return undefined;
}

function serializeProfile(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    uid: data.uid || id,
    email: data.email || '',
    displayName: data.displayName || data.name || '',
    role: data.role || 'visitante',
    status: data.status || (data.isActive === false ? 'inactive' : 'active'),
    isActive: data.isActive !== false && data.status !== 'inactive' && data.status !== 'deleted',
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    registrationStatus: data.registrationStatus || 'approved',
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    lastLogin: toIso(data.lastLogin),
    approvedBy: data.approvedBy,
    approvedAt: toIso(data.approvedAt),
  };
}

async function findProfileByEmail(email: string) {
  const exact = await db.collection('users').where('email', '==', email).limit(5).get();
  if (!exact.empty) return exact.docs;

  const lower = email.toLowerCase();
  if (lower !== email) {
    const lowered = await db.collection('users').where('email', '==', lower).limit(5).get();
    if (!lowered.empty) return lowered.docs;
  }

  return [];
}

function pickBestProfile(
  authEmail: string | undefined,
  uidDoc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot | null,
  emailDocs: FirebaseFirestore.QueryDocumentSnapshot[]
) {
  const candidates = [
    ...(uidDoc?.exists ? [uidDoc] : []),
    ...emailDocs,
  ];

  if (candidates.length === 0) return null;

  return candidates.sort((a, b) => {
    const aData = a.data() || {};
    const bData = b.data() || {};
    const aEmailMatch = authEmail && aData.email?.toLowerCase() === authEmail.toLowerCase() ? 1 : 0;
    const bEmailMatch = authEmail && bData.email?.toLowerCase() === authEmail.toLowerCase() ? 1 : 0;
    if (bEmailMatch !== aEmailMatch) return bEmailMatch - aEmailMatch;
    return (ROLE_RANK[bData.role] || 0) - (ROLE_RANK[aData.role] || 0);
  })[0];
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const authEmail = decoded.email || '';

    const uidDoc = await db.collection('users').doc(decoded.uid).get();
    const emailDocs = authEmail ? await findProfileByEmail(authEmail) : [];
    const best = pickBestProfile(authEmail, uidDoc.exists ? uidDoc : null, emailDocs);

    if (!best) {
      if (isMainSuperAdmin(authEmail)) {
        const profile = {
          uid: decoded.uid,
          email: getSuperAdminEmail(),
          displayName: decoded.name || 'Super Administrador',
          role: 'super_admin',
          status: 'active',
          isActive: true,
          permissions: ALL_PERMISSIONS,
          registrationStatus: 'approved',
          createdAt: new Date(),
          updatedAt: new Date(),
          approvedBy: 'system',
          approvedAt: new Date(),
        };
        await db.collection('users').doc(decoded.uid).set(profile, { merge: true });
        return NextResponse.json({ user: serializeProfile(decoded.uid, profile) });
      }

      return NextResponse.json({ user: null }, { status: 404 });
    }

    const data = best.data() || {};
    const profile = {
      ...data,
      uid: decoded.uid,
      email: authEmail || data.email,
      updatedAt: new Date(),
    };

    if (best.id !== decoded.uid || data.uid !== decoded.uid) {
      await db.collection('users').doc(decoded.uid).set(profile, { merge: true });
    }

    return NextResponse.json({
      user: serializeProfile(decoded.uid, profile),
    });
  } catch (error) {
    console.error('Error al resolver perfil de usuario:', error);
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 });
  }
}
