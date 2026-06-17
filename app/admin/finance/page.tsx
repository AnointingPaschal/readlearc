import Link from "next/link";
import { DollarSign, Percent, CreditCard, FileCode, ArrowUpRight } from "lucide-react";

export default function FinanceOverviewPage() {
  const stats = [
    { label: "Treasury Balance", value: "$1,284.50", sub: "USDC on Arc", icon: DollarSign, href: "/admin/finance/payouts", color: "text-usdc-400" },
    { label: "Fee Configuration", value: "10% / 5%", sub: "Platform / Referrer", icon: Percent, href: "/admin/finance/fees", color: "text-arc-400" },
    { label: "Platform Payouts", value: "12", sub: "Withdrawals to main wallet", icon: CreditCard, href: "/admin/finance/payouts", color: "text-blue-400" },
    { label: "Smart Contracts", value: "6", sub: "Deployed on Arc", icon: FileCode, href: "/admin/finance/contracts", color: "text-purple-400" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Finance Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Manage platform revenue, fee splits, and on-chain contracts.</p>
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
