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
  onClose,
}: {
  categories: CategoryDef[];
  counts: Record<string, number> | null;
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  onLogout: () => void;
  onClose?: () => void;
}) {
  const isActive = (tab: Tab) =>
    (tab.kind === "category" &&
      activeTab.kind === "category" &&
      tab.slug === activeTab.slug) ||
    (tab.kind !== "category" && activeTab.kind === tab.kind);

  return (
    <aside className="relative flex h-full flex-col overflow-hidden border-r border-pink-100 bg-white">
      {/* Soft 2D decorative shapes */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-pink-100/60" />
      <div className="pointer-events-none absolute -left-10 bottom-24 h-24 w-24 rounded-full bg-blue-100/60" />

      {/* Brand */}
      <div className="relative flex items-center gap-3 border-b border-pink-100 px-5 py-5">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-blue-400 shadow-sm shadow-pink-200">
          <Crown className="h-5 w-5 text-white" strokeWidth={2.2} />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-white" />
        </div>
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
      <nav className="relative flex-1 space-y-5 overflow-y-auto px-3 py-5">
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
                    onClick={() => onSelect({ kind: "category", slug: c.slug })}
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
            <Wand2 className="h-3 w-3 text-blue-400" />
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
      <div className="relative border-t border-pink-100 p-3">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition active:scale-[0.98] hover:border-pink-100 hover:bg-pink-50 hover:text-pink-600"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-400 transition group-hover:bg-pink-100 group-hover:text-pink-600">
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
// NavItem — 2D flat pill
// ─────────────────────────────────────────────

const TINTS: Record<string, { bg: string; text: string; activeBg: string }> = {
  wishes: { bg: "bg-amber-50", text: "text-amber-600", activeBg: "bg-amber-400" },
  congratulations: { bg: "bg-pink-50", text: "text-pink-600", activeBg: "bg-pink-400" },
  memories: { bg: "bg-sky-50", text: "text-sky-600", activeBg: "bg-sky-400" },
  moments: { bg: "bg-violet-50", text: "text-violet-600", activeBg: "bg-violet-400" },
  promises: { bg: "bg-emerald-50", text: "text-emerald-600", activeBg: "bg-emerald-400" },
  sorry: { bg: "bg-slate-50", text: "text-slate-500", activeBg: "bg-slate-400" },
  thankyou: { bg: "bg-rose-50", text: "text-rose-600", activeBg: "bg-rose-400" },
  video: { bg: "bg-fuchsia-50", text: "text-fuchsia-600", activeBg: "bg-fuchsia-400" },
  email: { bg: "bg-blue-50", text: "text-blue-600", activeBg: "bg-blue-400" },
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
      className={`group relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
        active
          ? "bg-white text-slate-800 shadow-sm shadow-pink-100 ring-1 ring-pink-100"
          : "text-slate-600 hover:bg-white/70 hover:text-slate-800"
      }`}
    >
      {active && (
        <motion.span
          layoutId="active-indicator"
          className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full ${colors.activeBg}`}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        />
      )}

      <span
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
          active
            ? `${colors.activeBg} text-white`
            : `${colors.bg} ${colors.text} group-hover:${colors.activeBg} group-hover:text-white`
        }`}
      >
        <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.3 : 2} />
      </span>

      <span className="flex-1 truncate text-left">{label}</span>

      {typeof count === "number" && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums transition ${
            active
              ? `${colors.activeBg} text-white`
              : "bg-pink-50 text-pink-600 group-hover:bg-pink-100"
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