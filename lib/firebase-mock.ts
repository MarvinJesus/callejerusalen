// Mock de Firebase para desarrollo sin configuración real
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Mock function
    return () => {};
  },
  signInWithEmailAndPassword: async (email: string, password: string) => {
    // Mock login
    return { user: { uid: 'demo-user', email } };
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    // Mock register
    return { user: { uid: 'demo-user', email } };
  },
  signOut: async () => {
    // Mock logout
    return Promise.resolve();
  },
  sendPasswordResetEmail: async (email: string) => {
    // Mock password reset
    return Promise.resolve();
  },
};

export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      set: async (data: any) => Promise.resolve(),
      get: async () => ({ exists: () => false, data: () => null }),
    }),
    add: async (data: any) => Promise.resolve({ id: 'demo-id' }),
  }),
};

export default { auth, db };











