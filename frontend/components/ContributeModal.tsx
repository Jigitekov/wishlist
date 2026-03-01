"use client";
import { useState } from "react";
import { X, Lock } from "lucide-react";
import { apiFetch } from "@/lib/store";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function ContributeModal({ item, onClose, onContributed }: {
  item: any;
  onClose: () => void;
  onContributed: (newTotal: number, count: number) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const remaining = item.price ? Math.max(0, item.price - item.total_contributed) : null;
  const progress = item.price ? Math.min((item.total_contributed / item.price) * 100, 100) : 0;

  async function handleContribute() {
    if (!name.trim()) { setError("Введите ваше имя"); return; }
    const amt = parseFloat(amount);
    if (!amt || amt < 1) { setError("Минимальная сумма — 1 ₸"); return; }

    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/items/${item.id}/contribute`, {
        method: "POST",
        body: JSON.stringify({ contributor_name: name, amount: amt }),
      });
      setSuccess(true);
      onContributed(data.new_total, item.contributor_count + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-8 shadow-2xl text-center">
          <div className="text-5xl mb-4">💰</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Спасибо за вклад!</h2>
          <p className="text-gray-500 text-sm mb-6">Ты помогаешь сделать чей-то праздник лучше 🎉</p>
          <button onClick={onClose} className="w-full py-3 gradient-brand text-white rounded-xl font-semibold">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Скинуться на подарок</h2>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Privacy note */}
          <div className="flex items-start gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Lock size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700">Владелец не видит кто и сколько скидывается</p>
          </div>

          {/* Item info */}
          <div>
            <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
            {item.price && (
              <>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Собрано</span>
                  <span className="font-medium text-gray-700">
                    {item.total_contributed.toLocaleString()} / {item.price.toLocaleString()} ₸
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {remaining !== null && remaining > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Осталось собрать: {remaining.toLocaleString()} ₸</p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Твоё имя *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              placeholder="Как тебя зовут?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Сумма (₸) *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    amount === String(q) ? "border-brand-400 bg-brand-50 text-brand-600" : "border-gray-200 text-gray-500"
                  }`}
                >
                  {q.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              placeholder="Другая сумма..."
              min="1"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <button
            onClick={handleContribute}
            disabled={loading}
            className="w-full py-3 gradient-brand text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Отправляем..." : `Внести ${amount ? parseFloat(amount).toLocaleString() + " ₸" : "вклад"} 💰`}
          </button>
        </div>
      </div>
    </div>
  );
}
