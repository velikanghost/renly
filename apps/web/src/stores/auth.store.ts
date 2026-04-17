import { create } from 'zustand';

interface AuthState {
  apiKey: string | null;
  token: string | null;
  workspaceId: string | null;
  isAuthed: boolean;
  isConnecting: boolean;

  setCredentials: (apiKey: string, token: string, workspaceId: string) => void;
  disconnect: () => void;
  setConnecting: (connecting: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  apiKey: null,
  token: null,
  workspaceId: null,
  isAuthed: false,
  isConnecting: false,

  setCredentials: (apiKey, token, workspaceId) =>
    set({
      apiKey,
      token,
      workspaceId,
      isAuthed: true,
      isConnecting: false,
    }),

  disconnect: () =>
    set({
      apiKey: null,
      token: null,
      workspaceId: null,
      isAuthed: false,
      isConnecting: false,
    }),

  setConnecting: (connecting) => set({ isConnecting: connecting }),
}));
