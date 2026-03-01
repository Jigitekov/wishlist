"use client";
import { useState } from "react";
import { X, Lock } from "lucide-react";
import { apiFetch } from "@/lib/store";

export default function ReserveModal({ item, onClose, onReserved }: {
  item: any;
  onClose: () => void;
  onReserved: () => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  async function handleReserve() {
    if (!name.trim()) { setError("Введите ваше имя"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/items/${item.id}/reserve`, {
        method: "POST",
        body: JSON.stringify({ reserver_name: name, reserver_contact: contact || null }),
      });
      setToken(data.token);
      // Save token to localStorage for potential unreserve
      const stored = JSON.parse(localStorage.getItem("reservations") || "{}");
      stored[item.id] = data.token;
      localStorage.setItem("reservations", JSON.stringify(stored));
    } catch (err: any) {
      if (err.message.includes("Already reserved")) {
        setError("Этот подарок уже зарезервирован. Хочешь присоединиться к сбору?");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (token) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-8 shadow-2xl text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Подарок зарезервирован!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Только ты знаешь о своём выборе — владелец вишлиста не увидит твоё имя до самого момента
          </p>
          <button onClick={onReserved} className="w-full py-3 gradient-brand text-white rounded-xl font-semibold">
            Отлично!
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
          <h2 className="text-lg font-bold text-gray-900">Зарезервировать</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Privacy note */}
          <div className="flex items-start gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Lock size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700">
              Твоё имя будет скрыто от владельца вишлиста — сюрприз в безопасности 🎁
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1 font-medium">Резервируешь:</p>
            <p className="font-semibold text-gray-900">{item.title}</p>
            {item.price && <p className="text-brand-500 font-bold">{item.price.toLocaleString()} ₸</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Твоё имя *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              placeholder="Как тебя зовут?"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Контакт <span className="text-gray-400 font-normal">(необязательно)</span>
            </label>
            <input
              type="text"
              value={contact}
              onChange={e => setContact(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              placeholder="Телефон или email"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <button
            onClick={handleReserve}
            disabled={loading}
            className="w-full py-3 gradient-brand text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Резервируем..." : "Зарезервировать 🎁"}
          </button>
        </div>
      </div>
    </div>
  );
}
