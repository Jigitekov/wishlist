"use client";
import { useState } from "react";
import { ExternalLink, Trash2, Users } from "lucide-react";
import { apiFetch } from "@/lib/store";

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

interface Props {
  item: Item;
  isOwner: boolean;
  wishlistId: string;
  onReserve: () => void;
  onContribute: () => void;
  onDelete: () => void;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: "🔥 Очень хочу", color: "bg-red-50 text-red-500" },
  medium: { label: "⭐ Хочу", color: "bg-amber-50 text-amber-500" },
  low: { label: "💙 Было бы неплохо", color: "bg-blue-50 text-blue-400" },
};

export default function GiftCard({ item, isOwner, wishlistId, onReserve, onContribute, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);
  const priority = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
  const hasGroupCollection = item.price && item.price > 0;
  const progress = hasGroupCollection ? Math.min((item.total_contributed / item.price!) * 100, 100) : 0;
  const isFullyFunded = progress >= 100;

  async function handleDelete() {
    if (!confirm("Удалить желание?")) return;
    setDeleting(true);
    try {
      await apiFetch(`/items/${item.id}`, { method: "DELETE" });
      onDelete();
    } catch (e) {
      alert("Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all animate-fade-in ${item.is_reserved ? "ring-2 ring-green-200" : ""}`}>
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-5xl">🎁</span>
        )}

        {/* Reserved overlay */}
        {item.is_reserved && (
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex flex-col items-center justify-center">
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm text-center">
              <p className="text-green-600 font-semibold text-sm">✓ Зарезервировано</p>
              {item.reserver_initial && (
                <p className="text-gray-400 text-xs">другом «{item.reserver_initial}»</p>
              )}
            </div>
          </div>
        )}

        {/* Priority badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
          {priority.label}
        </div>

        {/* Delete (owner) */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-2 right-2 w-8 h-8 bg-white/80 hover:bg-white text-gray-400 hover:text-red-400 rounded-full flex items-center justify-center transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{item.title}</h3>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-gray-300 hover:text-brand-400 transition-colors">
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {item.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.description}</p>
        )}

        {item.price && (
          <p className="text-brand-500 font-bold text-lg mb-3">
            {item.price.toLocaleString("ru-RU")} ₸
          </p>
        )}

        {/* Group collection progress */}
        {hasGroupCollection && item.total_contributed > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span className="flex items-center gap-1"><Users size={11} /> {item.contributor_count} чел.</span>
              <span>{item.total_contributed.toLocaleString()} / {item.price!.toLocaleString()} ₸</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {isFullyFunded && (
              <p className="text-xs text-green-500 mt-1 font-medium">🎉 Сумма собрана!</p>
            )}
          </div>
        )}

        {/* Actions (non-owner only) */}
        {!isOwner && (
          <div className="flex gap-2">
            {!item.is_reserved ? (
              <button
                onClick={onReserve}
                className="flex-1 py-2 gradient-brand text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Зарезервировать
              </button>
            ) : (
              <div className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-medium text-center">
                ✓ Занято
              </div>
            )}
            {hasGroupCollection && !isFullyFunded && (
              <button
                onClick={onContribute}
                className="px-3 py-2 bg-gray-50 hover:bg-amber-50 text-gray-500 hover:text-amber-600 rounded-xl text-sm transition-colors"
                title="Скинуться"
              >
                💰
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
