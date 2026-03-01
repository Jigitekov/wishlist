"use client";
import Link from "next/link";
import { Gift, Share2, Heart, Zap } from "lucide-react";

const OCCASIONS = [
  { emoji: "🎂", label: "День рождения" },
  { emoji: "🎆", label: "Новый год" },
  { emoji: "💍", label: "Свадьба" },
  { emoji: "🎁", label: "Любой повод" },
];

const HOW_IT_WORKS = [
  { icon: Gift, title: "Создай список", desc: "Добавь желания с названием, ценой и картинкой. Вставь ссылку — мы заполним сами." },
  { icon: Share2, title: "Поделись ссылкой", desc: "Друзья открывают вишлист без регистрации. Ничего лишнего." },
  { icon: Heart, title: "Сюрприз сохранён", desc: "Друзья резервируют подарки, ты не видишь кто что выбрал до самого момента." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-500">🎁 WishFlow</span>
          <div className="flex gap-3">
            <Link href="/auth/login" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Войти
            </Link>
            <Link href="/auth/register" className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
              Начать
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-soft pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-200 rounded-full text-brand-600 text-sm font-medium mb-8">
            <Zap size={14} /> Реалтайм обновления
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-gray-900">
            Вишлист, который<br />
            <span className="text-brand-500">хранит сюрприз</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Создай список желаний, поделись с друзьями. Они зарезервируют подарки — ты не узнаешь кто что выбрал.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="px-8 py-4 bg-brand-500 text-white rounded-xl font-semibold text-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200">
              Создать вишлист бесплатно
            </Link>
            <Link href="/auth/login" className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border hover:bg-gray-50 transition-colors">
              Войти
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {OCCASIONS.map(o => (
            <span key={o.label} className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm border">
              {o.emoji} {o.label}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14 text-gray-900">Как это работает</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-brand-200">
                  <step.icon size={24} className="text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Group gifts */}
      <section className="py-20 px-4 gradient-soft">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">💰</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Дорогой подарок? Скиньтесь вместе</h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Если подарок стоит дорого, несколько друзей могут скинуться. Прогресс-бар показывает сколько уже собрали. Владелец списка не видит кто и сколько внёс.
          </p>
        </div>
      </section>

      <footer className="border-t py-8 px-4 text-center text-gray-400 text-sm bg-white">
        WishFlow © 2024 · Сделано с ❤️
      </footer>
    </main>
  );
}
