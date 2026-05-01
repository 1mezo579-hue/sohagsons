import { create } from "zustand";

interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isChecked: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,
  isChecked: false,
  login: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pos_user", JSON.stringify(user));
    }
    set({ user, isLoggedIn: true, isChecked: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pos_user");
    }
    set({ user: null, isLoggedIn: false, isChecked: true });
  },
  loadFromStorage: () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pos_user");
      if (saved) {
        try {
          const user = JSON.parse(saved);
          set({ user, isLoggedIn: true, isChecked: true });
        } catch {
          localStorage.removeItem("pos_user");
          set({ user: null, isLoggedIn: false, isChecked: true });
        }
      } else {
        set({ user: null, isLoggedIn: false, isChecked: true });
      }
    }
  },
}));
