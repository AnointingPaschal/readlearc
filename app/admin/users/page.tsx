import Link from "next/link";
import { Users, PenTool, UserCheck, Shield, ArrowUpRight } from "lucide-react";

export default function UsersOverviewPage() {
  const stats = [
    { label: "Writers", value: "2,405", sub: "18 verified", icon: PenTool, href: "/admin/users/writers", color: "text-arc-400" },
    { label: "Readers", value: "6,935", sub: "Active this week", icon: UserCheck, href: "/admin/users/readers", color: "text-blue-400" },
    { label: "Admin Roles", value: "6", sub: "3 super admins", icon: Shield, href: "/admin/users/roles", color: "text-purple-400" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">User Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Manage writers, readers, and platform roles.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
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
