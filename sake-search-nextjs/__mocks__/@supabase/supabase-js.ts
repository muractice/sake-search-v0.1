// Supabase JSクライアントのモック
export const createClient = jest.fn(() => ({
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(),
}));

export interface User {
  id: string;
  email?: string;
}

export interface Session {
  user: User;
}