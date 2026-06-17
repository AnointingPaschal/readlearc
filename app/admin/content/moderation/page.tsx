"use client";
import { useState } from "react";
import { Flag, ShieldAlert, Bot, CheckCircle, Ban, Trash2, ArrowUpRight } from "lucide-react";

const QUEUE = [
  { id: "1", title: "How to Earn $500/month Writing on Web3 Platforms", author: "spammer123", flags: 12, aiScore: "HIGH", aiReasons: ["Promotes get-rich-quick scheme", "Excessive referral links"], aiRec: "REJECT", status: "PENDING" },
  { id: "2", title: "The Truth About Arc Development", author: "angrydev99", flags: 4, aiScore: "MEDIUM", aiReasons: ["Aggressive language", "Potential harassment"], aiRec: "REVIEW", status: "PENDING" },
];

export default function ModerationPage() {
  const [queue, setQueue] = useState(QUEUE);
  const [actioned, setActioned] = useState<string[]>([]);

  function handleAction(id: string, action: string) {
    setActioned([...actioned, id]);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          Moderation Queue <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-mono">{queue.length - actioned.length} pending</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Review flagged content and AI moderation recommendations.</p>
      </div>

      <div className="space-y-4">
        {queue.map((item) => {
          if (actioned.includes(item.id)) return null;
          return (
            <div key={item.id} className="glass rounded-2xl p-6 border-l-4 border-l-red-500">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="font-semibold text-lg text-white">{item.title}</h2>
                    <a href={`/article/${item.id}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                    <span>By @{item.author}</span>
                    <span className="flex items-center gap-1 text-red-400"><Flag className="w-3 h-3" /> {item.flags} user flags</span>
                  </div>

                  <div className="bg-[#111827] rounded-xl p-4 border border-white/5 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-arc-400" />
                      <span className="text-sm font-semibold text-gray-300">AI Analysis</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto ${item.aiScore === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                        RISK: {item.aiScore}
                      </span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-gray-400 mb-2">
                      {item.aiReasons.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                    <div className="text-xs font-mono text-gray-500">Recommendation: <span className="text-white font-semibold">{item.aiRec}</span></div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleAction(item.id, "approve")} className="flex items-center gap-1.5 px-4 py-2 bg-usdc-600/20 text-usdc-400 hover:bg-usdc-600/30 rounded-lg text-sm font-semibold transition-colors">
                      <CheckCircle className="w-4 h-4" /> Approve & Clear
                    </button>
                    <button onClick={() => handleAction(item.id, "warn")} className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 rounded-lg text-sm font-semibold transition-colors">
                      <ShieldAlert className="w-4 h-4" /> Add Warning Banner
                    </button>
                    <button onClick={() => handleAction(item.id, "remove")} className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-sm font-semibold transition-colors">
                      <Trash2 className="w-4 h-4" /> Unpublish
                    </button>
                    <button onClick={() => handleAction(item.id, "ban")} className="flex items-center gap-1.5 px-4 py-2 glass border border-red-500/20 text-gray-400 hover:text-red-400 transition-colors rounded-lg text-sm font-semibold ml-auto">
                      <Ban className="w-4 h-4" /> Suspend User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {queue.length - actioned.length === 0 && (
          <div className="text-center py-12 glass rounded-2xl">
            <CheckCircle className="w-10 h-10 text-usdc-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold">Queue Empty</h3>
            <p className="text-sm text-gray-500">All flagged content has been reviewed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
