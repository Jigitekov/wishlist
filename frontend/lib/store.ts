"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

// persist сохраняет token и user в localStorage автоматически
// при следующем открытии браузера — пользователь уже залогинен
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "wishflow-auth", // ключ в localStorage
    }
  )
);

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    // Если токен протух — разлогиниваем
    if (res.status === 401) {
      useAuthStore.getState().logout();
    }
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}
