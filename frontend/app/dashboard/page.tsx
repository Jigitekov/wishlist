"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, LogOut, Share2, Trash2, Gift } from "lucide-react";
import { apiFetch, useAuthStore } from "@/lib/store";

interface Wishlist {
  id: string; slug: string; title: string;
  occasion: string; occasion_emoji: string; item_count: number;
}

export default function DashboardPage() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    apiFetch("/wishlists/my").then(setWishlists).finally(() => setLoading(false));
  }, [token]);

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/wish/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  async function deleteWishlist(id: string) {
    if (!confirm("Удалить вишлист?")) return;
    await apiFetch(`/wishlists/${id}`, { method: "DELETE" });
    setWishlists(prev => prev.filter(w => w.id !== id));
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold gradient-brand bg-clip-text text-transparent">🎁 WishFlow</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
            <button onClick={() => { logout(); router.push("/"); }} className="p-2 text-gray-400 hover:text-gray-600">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мои вишлисты</h1>
            <p className="text-gray-500 text-sm mt-1">Управляй своими списками желаний</p>
          </div>
          <Link href="/wishlists/new" className="flex items-center gap-2 px-4 py-2.5 gradient-brand text-white rounded-xl font-medium hover:opacity-90 shadow-md">
            <Plus size={18} /> Создать
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-20 text-gray-400">Загружаем...</div>
        ) : wishlists.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="text-7xl mb-6">🎁</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ещё нет вишлистов</h2>
            <p className="text-gray-500 mb-8">Создай свой первый список желаний</p>
            <Link href="/wishlists/new" className="inline-flex items-center gap-2 px-6 py-3 gradient-brand text-white rounded-xl font-medium hover:opacity-90">
              <Plus size={18} /> Создать вишлист
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlists.map(w => (
              <div key={w.id} className="bg-white rounded-2xl border hover:shadow-md transition-shadow p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{w.occasion_emoji}</span>
                </div>
                <Link href={`/wish/${w.slug}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-brand-500 mb-1">{w.title}</h3>
                </Link>
                <p className="text-sm text-gray-400 mb-4">{w.item_count === 0 ? "Нет желаний" : `${w.item_count} желаний`}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(w.slug)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-brand-50 text-gray-600 hover:text-brand-500 rounded-lg text-sm">
                    <Share2 size={14} /> {copied === w.slug ? "Скопировано!" : "Поделиться"}
                  </button>
                  <Link href={`/wish/${w.slug}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 gradient-brand text-white rounded-lg text-sm hover:opacity-90">
                    <Gift size={14} /> Открыть
                  </Link>
                  <button onClick={() => deleteWishlist(w.id)} className="p-2 text-gray-300 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
