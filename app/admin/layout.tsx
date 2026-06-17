"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, LayoutDashboard, Settings, Palette, Search, Bot, Server, Cpu, FileText, BookOpen,
  Flag, Star, Tag, Users, PenTool, UserCheck, Shield, DollarSign, Percent, CreditCard,
  FileCode, Lock, ScrollText, Bell, ChevronRight, LogOut, Menu, X
} from "lucide-react";
import { useState } from "react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/admin/site", label: "General", icon: Settings },
      { href: "/admin/site/branding", label: "Branding", icon: Palette },
      { href: "/admin/site/theme", label: "Theme", icon: Cpu },
      { href: "/admin/site/seo", label: "SEO", icon: Search },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/admin/ai", label: "Overview", icon: Bot },
      { href: "/admin/ai/providers", label: "Providers", icon: Server },
      { href: "/admin/ai/models", label: "Models", icon: Cpu },
      { href: "/admin/ai/prompts", label: "Prompts", icon: FileText },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content", label: "Overview", icon: BookOpen },
      { href: "/admin/content/articles", label: "Articles", icon: FileText },
      { href: "/admin/content/moderation", label: "Moderation", icon: Flag },
      { href: "/admin/content/featured", label: "Featured", icon: Star },
      { href: "/admin/content/categories", label: "Categories", icon: Tag },
    ],
  },
  {
    label: "Users",
    items: [
      { href: "/admin/users", label: "Overview", icon: Users },
      { href: "/admin/users/writers", label: "Writers", icon: PenTool },
      { href: "/admin/users/readers", label: "Readers", icon: UserCheck },
      { href: "/admin/users/roles", label: "Roles", icon: Shield },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/finance", label: "Overview", icon: DollarSign },
      { href: "/admin/finance/fees", label: "Fees", icon: Percent },
      { href: "/admin/finance/payouts", label: "Payouts", icon: CreditCard },
      { href: "/admin/finance/contracts", label: "Contracts", icon: FileCode },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/security", label: "Security", icon: Lock },
      { href: "/admin/logs", label: "Activity Logs", icon: ScrollText },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 admin-sidebar flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-16 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arc-500 to-usdc-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="font-heading font-bold text-sm">Readlearc</div>
            <div className="text-[10px] text-gray-600">Admin Console</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] text-gray-700 uppercase tracking-widest font-semibold px-2 mb-1">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? "bg-arc-600/20 text-arc-300 border border-arc-500/20"
                          : "text-gray-500 hover:text-gray-300 hover:bg-white/4"
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                      {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-arc-500 to-usdc-500" />
            <div>
              <div className="text-xs font-semibold text-white">Super Admin</div>
              <div className="text-[10px] text-gray-600">admin@readlearc.io</div>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-600 hover:text-gray-400 hover:bg-white/4 transition-all">
            <LogOut className="w-3.5 h-3.5" /> Exit Admin
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-white/5 h-16 flex items-center justify-between px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {pathname.split("/").filter(Boolean).map((seg, i, arr) => (
              <span key={seg} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <span className={i === arr.length - 1 ? "text-white capitalize" : "capitalize"}>{seg}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-usdc-400 bg-usdc-500/10 border border-usdc-500/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-usdc-400 animate-pulse" />
              Arc Testnet · Live
            </div>
            <button className="relative p-2 glass rounded-lg">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] flex items-center justify-center">2</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
