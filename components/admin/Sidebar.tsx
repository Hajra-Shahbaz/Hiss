"use client";

import {
  CakeSlice,
  ChevronRight,
  Crown,
  Heart,
  HeartHandshake,
  Mail,
  PartyPopper,
  Sparkles,
  Video as VideoIcon,
  Wand2,
  MessageCircleHeart,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { CategoryDef, ContentSlug, Tab } from "./types";

// Cute, distinct icon per section
const CATEGORY_ICONS: Record<ContentSlug, LucideIcon> = {
  wishes: Sparkles,
  congratulations: PartyPopper,
  memories: CakeSlice,
  moments: Wand2,
  promises: HeartHandshake,
  sorry: MessageCircleHeart,
  thankyou: Heart,
};

export default function Sidebar({
  categories,
  counts,
  activeTab,
  onSelect,
  onLogout,
}: {
  categories: CategoryDef[];
  counts: Record<string, number> | null;
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  onLogout: () => void;
}) {
  const isActive = (tab: Tab) =>
    (tab.kind === "category" &&
      activeTab.kind === "category" &&
      tab.slug === activeTab.slug) ||
    (tab.kind !== "category" && activeTab.kind === tab.kind);

  return (
    <aside className="relative flex h-full flex-col overflow-hidden border-r border-pink-100/80 bg-gradient-to-b from-white via-pink-50/40 to-white">
      {/* Soft decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-pink-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-rose-200/30 blur-3xl" />

      {/* Brand */}
      <div className="relative flex items-center gap-3 border-b border-pink-100/70 px-5 py-5">
        <motion.div
          initial={{ scale: 0.85, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 shadow-lg shadow-pink-300/60"
        >
          <Crown className="h-5 w-5 text-white" strokeWidth={2.2} />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-white" />
        </motion.div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold tracking-tight text-slate-800">
            Admin Panel
          </p>
          <p className="flex items-center gap-1 text-[11px] font-medium text-pink-500">
            <Heart className="h-3 w-3 fill-pink-400 text-pink-400" />
            Birthday experience
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {/* Content sections */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            <Sparkles className="h-3 w-3 text-pink-400" />
            Content
          </p>
          <ul className="space-y-1">
            {categories.map((c) => {
              const Icon = CATEGORY_ICONS[c.slug];
              return (
                <li key={c.slug}>
                  <NavItem
                    icon={Icon}
                    label={c.label}
                    count={counts?.[c.slug]}
                    active={isActive({ kind: "category", slug: c.slug })}
                    onClick={() =>
                      onSelect({ kind: "category", slug: c.slug })
                    }
                    tint={c.slug}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        {/* Media & Tools */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            <Wand2 className="h-3 w-3 text-pink-400" />
            Media & Tools
          </p>
          <ul className="space-y-1">
            <li>
              <NavItem
                icon={VideoIcon}
                label="Main Video"
                active={isActive({ kind: "video" })}
                onClick={() => onSelect({ kind: "video" })}
                tint="video"
              />
            </li>
            <li>
              <NavItem
                icon={Mail}
                label="Send Email"
                active={isActive({ kind: "email" })}
                onClick={() => onSelect({ kind: "email" })}
                tint="email"
              />
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="relative border-t border-pink-100/70 p-3">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:border-rose-100 hover:bg-rose-50/70 hover:text-rose-600"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-rose-100 group-hover:text-rose-600">
            <LogOut className="h-3.5 w-3.5" />
          </span>
          <span className="flex-1 text-left">Sign out</span>
        </button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Made with <span className="text-pink-400">💙</span>
        </p>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// NavItem — animated cute pill
// ─────────────────────────────────────────────

const TINTS: Record<string, { from: string; to: string; shadow: string }> = {
  wishes: { from: "from-amber-400", to: "to-orange-400", shadow: "shadow-amber-300/50" },
  congratulations: { from: "from-pink-400", to: "to-rose-400", shadow: "shadow-pink-300/50" },
  memories: { from: "from-sky-400", to: "to-indigo-400", shadow: "shadow-sky-300/50" },
  moments: { from: "from-violet-400", to: "to-purple-400", shadow: "shadow-violet-300/50" },
  promises: { from: "from-emerald-400", to: "to-teal-400", shadow: "shadow-emerald-300/50" },
  sorry: { from: "from-slate-400", to: "to-slate-500", shadow: "shadow-slate-300/50" },
  thankyou: { from: "from-rose-400", to: "to-pink-400", shadow: "shadow-rose-300/50" },
  video: { from: "from-fuchsia-400", to: "to-pink-500", shadow: "shadow-fuchsia-300/50" },
  email: { from: "from-indigo-400", to: "to-blue-500", shadow: "shadow-indigo-300/50" },
};

function NavItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  tint: string;
}) {
  const colors = TINTS[tint] ?? TINTS.wishes;

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-white text-slate-800 shadow-md shadow-pink-100"
          : "text-slate-600 hover:bg-white/60 hover:text-slate-800"
      }`}
    >
      {/* Active indicator strip */}
      {active && (
        <motion.span
          layoutId="active-indicator"
          className={`absolute left-0 top-1/2 h-6 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b ${colors.from} ${colors.to}`}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        />
      )}

      {/* Icon chip */}
      <span
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
          active
            ? `bg-gradient-to-br ${colors.from} ${colors.to} text-white shadow-md ${colors.shadow}`
            : `bg-${tint}-50 bg-pink-50/70 text-slate-500 group-hover:bg-pink-100/70 group-hover:text-pink-600`
        }`}
      >
        <Icon
          className="h-[17px] w-[17px]"
          strokeWidth={active ? 2.3 : 2}
        />
      </span>

      <span className="flex-1 truncate text-left">{label}</span>

      {typeof count === "number" && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums transition ${
            active
              ? `bg-gradient-to-br ${colors.from} ${colors.to} text-white`
              : "bg-pink-100/80 text-pink-700 group-hover:bg-pink-200/80"
          }`}
        >
          {count}
        </span>
      )}

      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 transition-all ${
          active
            ? "translate-x-0 text-pink-400 opacity-100"
            : "-translate-x-1 text-slate-300 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
        }`}
      />
    </button>
  );
}