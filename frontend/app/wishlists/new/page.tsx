"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch, useAuthStore } from "@/lib/store";

const OCCASIONS = [
  { value: "birthday", emoji: "🎂", label: "День рождения" },
  { value: "newyear", emoji: "🎆", label: "Новый год" },
  { value: "wedding", emoji: "💍", label: "Свадьба" },
  { value: "other", emoji: "🎁", label: "Другое" },
];

export default function NewWishlistPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occasion, setOccasion] = useState("birthday");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) { router.push("/auth/login"); return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/wishlists/", { method: "POST", body: JSON.stringify({ title, description, occasion }) });
      router.push(`/wish/${data.slug}`);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen gradient-soft px-4 py-10">
      <div className="max-w-lg mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-8 text-sm">
          <ArrowLeft size={16} /> Назад
        </Link>
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Новый вишлист</h1>
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Повод</label>
              <div className="grid grid-cols-2 gap-2">
                {OCCASIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => setOccasion(o.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${occasion === o.value ? "border-brand-400 bg-brand-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <span className="text-2xl">{o.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="Мой день рождения 2024" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                placeholder="Немного о поводе..." rows={3} />
            </div>
            {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 gradient-brand text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50">
              {loading ? "Создаём..." : "Создать вишлист ✨"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
