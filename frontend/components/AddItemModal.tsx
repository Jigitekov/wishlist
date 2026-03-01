"use client";
import { useState } from "react";
import { X, Sparkles, Loader } from "lucide-react";
import { apiFetch, API_URL } from "@/lib/store";

const PRIORITIES = [
  { value: "high", label: "🔥 Очень хочу" },
  { value: "medium", label: "⭐ Хочу" },
  { value: "low", label: "💙 Было бы неплохо" },
];

export default function AddItemModal({ wishlistId, onClose, onAdded }: {
  wishlistId: string;
  onClose: () => void;
  onAdded: (item: any) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function autofill() {
    if (!url.trim()) return;
    setParsing(true);
    setError("");
    try {
      const data = await apiFetch("/items/parse-url", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      if (data.title) setTitle(data.title);
      if (data.price) setPrice(String(data.price));
      if (data.image_url) setImageUrl(data.image_url);
      if (data.description) setDescription(data.description.slice(0, 300));
    } catch {
      setError("Не удалось загрузить данные по ссылке");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Введите название"); return; }
    setLoading(true);
    setError("");
    try {
      const item = await apiFetch(`/items/wishlists/${wishlistId}/items`, {
        method: "POST",
        body: JSON.stringify({
          title,
          url: url || null,
          price: price ? parseFloat(price) : null,
          image_url: imageUrl || null,
          description: description || null,
          priority,
        }),
      });
      onAdded({
        ...item,
        url, price: price ? parseFloat(price) : null,
        image_url: imageUrl, description, priority,
        is_deleted: false, is_reserved: false,
        total_contributed: 0, contributor_count: 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Добавить желание</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* URL + autofill */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на товар</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onBlur={() => url && autofill()}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
                placeholder="https://ozon.ru/product/..."
              />
              <button
                type="button"
                onClick={autofill}
                disabled={!url || parsing}
                className="px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {parsing ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Заполнить
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Вставь ссылку — мы автоматически подтянем название и цену</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              placeholder="Например: Кроссовки Nike Air Max"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₸)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Картинка (URL)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              placeholder="https://..."
            />
            {imageUrl && (
              <img src={imageUrl} alt="" className="mt-2 h-20 w-20 object-cover rounded-lg border" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm resize-none"
              rows={2}
              placeholder="Дополнительная информация..."
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                    priority === p.value ? "border-brand-400 bg-brand-50 text-brand-600" : "border-gray-100 text-gray-500"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 gradient-brand text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Добавляем..." : "Добавить желание ✨"}
          </button>
        </form>
      </div>
    </div>
  );
}
