import Link from "next/link";
import { BookOpen, Flag, Star, Tag, ArrowUpRight } from "lucide-react";

export default function ContentOverviewPage() {
  const stats = [
    { label: "Total Articles", value: "12,847", sub: "286 published today", icon: BookOpen, href: "/admin/content/articles", color: "text-arc-400" },
    { label: "Flagged Content", value: "7", sub: "Awaiting review", icon: Flag, href: "/admin/content/moderation", color: "text-red-400" },
    { label: "Featured Slots", value: "4/5", sub: "1 slot available", icon: Star, href: "/admin/content/featured", color: "text-yellow-400" },
    { label: "Categories", value: "12", sub: "Tags: 1,204", icon: Tag, href: "/admin/content/categories", color: "text-blue-400" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Content Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Manage articles, moderation, and curation.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <Link key={s.href} href={s.href} className="glass rounded-2xl p-6 hover:border-arc-500/20 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
            </div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-sm font-medium text-white mt-1">{s.label}</div>
            <div className="text-xs text-gray-600">{s.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
