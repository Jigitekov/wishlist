"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, useAuthStore } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
      setAuth(data.token, data.user);
      router.push("/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold gradient-brand bg-clip-text text-transparent">🎁 WishFlow</Link>
          <p className="text-gray-500 mt-2">Создайте аккаунт</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ваше имя</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="Алия Бекова" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="Минимум 6 символов" required />
            </div>
            {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 gradient-brand text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50">
              {loading ? "Создаём..." : "Зарегистрироваться"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Уже есть аккаунт? <Link href="/auth/login" className="text-brand-500 font-medium hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
}
