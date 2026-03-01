"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Share2, Plus, Check, AlertTriangle } from "lucide-react";
import { apiFetch, useAuthStore, WS_URL } from "@/lib/store";
import GiftCard from "@/components/GiftCard";
import AddItemModal from "@/components/AddItemModal";
import ReserveModal from "@/components/ReserveModal";
import ContributeModal from "@/components/ContributeModal";

interface Item {
  id: string;
  title: string;
  url?: string;
  price?: number;
  image_url?: string;
  description?: string;
  priority: string;
  is_deleted: boolean;
  is_reserved: boolean;
  reserver_initial?: string;
  total_contributed: number;
  contributor_count: number;
}

interface Wishlist {
  id: string;
  slug: string;
  title: string;
  description?: string;
  occasion: string;
  occasion_emoji: string;
  owner: { name: string; avatar_url?: string };
  is_owner: boolean;
  items: Item[];
}

export default function WishlistPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { token } = useAuthStore();
  const router = useRouter();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reserveItem, setReserveItem] = useState<Item | null>(null);
  const [contributeItem, setContributeItem] = useState<Item | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!slug) return;
    apiFetch(`/wishlists/${slug}`)
      .then(setWishlist)
      .catch(() => setError("Вишлист не найден"))
      .finally(() => setLoading(false));
  }, [slug, token]);

  useEffect(() => {
    if (!slug) return;
    const ws = new WebSocket(`${WS_URL}/ws/${slug}`);
    wsRef.current = ws;
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setWishlist((prev) => {
        if (!prev) return prev;
        const items = [...prev.items];
        if (data.type === "item_added") return { ...prev, items: [...items, data.item] };
        if (data.type === "item_deleted") return { ...prev, items: items.map(i => i.id === data.item_id ? { ...i, is_deleted: true } : i) };
        if (data.type === "item_reserved") return { ...prev, items: items.map(i => i.id === data.item_id ? { ...i, is_reserved: true, reserver_initial: data.reserver_initial } : i) };
        if (data.type === "item_unreserved") return { ...prev, items: items.map(i => i.id === data.item_id ? { ...i, is_reserved: false } : i) };
        if (data.type === "contribution_added") return { ...prev, items: items.map(i => i.id === data.item_id ? { ...i, total_contributed: data.new_total, contributor_count: data.contributor_count } : i) };
        return prev;
      });
    };
    const ping = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send("ping"); }, 30000);
    return () => { ws.close(); clearInterval(ping); };
  }, [slug]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse-slow">🎁</div>
          <p className="text-gray-400">Загружаем вишлист...</p>
        </div>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-6">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Вишлист не найден</h1>
          <p className="text-gray-500 mb-6">Возможно ссылка устарела или список был удалён</p>
          <button onClick={() => router.push("/")} className="px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600">
            На главную
          </button>
        </div>
      </div>
    );
  }

  const activeItems = wishlist.items.filter(i => !i.is_deleted);
  const deletedItems = wishlist.items.filter(i => i.is_deleted);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="text-lg font-bold text-brand-500">🎁 WishFlow</a>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-400" : "bg-gray-300"}`} />
              {wsConnected ? "Онлайн" : "Офлайн"}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-lg text-sm text-gray-600 hover:border-brand-300 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
              {copied ? "Скопировано!" : "Поделиться"}
            </button>
          </div>
        </div>
      </header>

      {/* Wishlist header */}
      <div className="gradient-soft border-b">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-start gap-4">
            <span className="text-5xl">{wishlist.occasion_emoji}</span>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{wishlist.title}</h1>
              {wishlist.description && <p className="text-gray-500 mb-3">{wishlist.description}</p>}
              <p className="text-sm text-gray-400">
                Вишлист {wishlist.is_owner ? "ваш" : wishlist.owner.name}
              </p>
              {wishlist.is_owner && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-full">
                  👀 Вы владелец — имена дарителей скрыты от вас
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Add button */}
        {wishlist.is_owner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mb-8 py-4 border-2 border-dashed border-brand-200 text-brand-400 rounded-2xl font-medium hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Добавить желание
          </button>
        )}

        {/* Empty state */}
        {activeItems.length === 0 && !wishlist.is_owner && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎀</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Список пока пуст</h2>
            <p className="text-gray-400">Владелец ещё не добавил желания — загляни позже</p>
          </div>
        )}

        {/* Items */}
        {activeItems.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeItems.map(item => (
              <GiftCard
                key={item.id}
                item={item}
                isOwner={wishlist.is_owner}
                wishlistId={wishlist.id}
                onReserve={() => setReserveItem(item)}
                onContribute={() => setContributeItem(item)}
                onDelete={() => setWishlist(prev => prev ? { ...prev, items: prev.items.map(i => i.id === item.id ? { ...i, is_deleted: true } : i) } : prev)}
              />
            ))}
          </div>
        )}

        {/* Deleted items (owner only) */}
        {wishlist.is_owner && deletedItems.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <AlertTriangle size={14} /> Удалённые желания
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-50">
              {deletedItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border p-4 line-through text-gray-400">
                  <p className="font-medium">{item.title}</p>
                  {item.contributor_count > 0 && (
                    <p className="text-xs text-amber-500 mt-1 no-underline" style={{ textDecoration: "none" }}>
                      ⚠️ Был сбор ({item.contributor_count} участников)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showAddModal && wishlist.is_owner && (
        <AddItemModal
          wishlistId={wishlist.id}
          onClose={() => setShowAddModal(false)}
          onAdded={(item) => { setWishlist(prev => prev ? { ...prev, items: [...prev.items, item] } : prev); setShowAddModal(false); }}
        />
      )}
      {reserveItem && (
        <ReserveModal
          item={reserveItem}
          onClose={() => setReserveItem(null)}
          onReserved={() => { setWishlist(prev => prev ? { ...prev, items: prev.items.map(i => i.id === reserveItem.id ? { ...i, is_reserved: true } : i) } : prev); setReserveItem(null); }}
        />
      )}
      {contributeItem && (
        <ContributeModal
          item={contributeItem}
          onClose={() => setContributeItem(null)}
          onContributed={(newTotal, count) => { setWishlist(prev => prev ? { ...prev, items: prev.items.map(i => i.id === contributeItem.id ? { ...i, total_contributed: newTotal, contributor_count: count } : i) } : prev); setContributeItem(null); }}
        />
      )}
    </div>
  );
}
