"use client";
import { useState } from "react";
import { Save, Upload, Image } from "lucide-react";

export default function BrandingPage() {
  const [colors, setColors] = useState({ primary: "#7C3AED", secondary: "#10B981", background: "#0F0F0F", text: "#F9FAFB" });
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Branding</h1>
        <p className="text-gray-500 text-sm mt-1">Upload logos and set brand colors.</p>
      </div>

      {/* Logo upload */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-sm text-gray-300">Logo & Images</h2>
        {[
          { label: "Site Logo", hint: "PNG, SVG, WebP · Max 2MB · Recommended 200×60px" },
          { label: "Favicon", hint: "ICO, PNG · 32×32 or 64×64px" },
          { label: "OG Image", hint: "Social share card · Recommended 1200×630px" },
        ].map((item) => (
          <div key={item.label}>
            <label className="text-sm font-medium text-gray-300 mb-2 block">{item.label}</label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-arc-500/40 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-arc-500/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-arc-400" />
              </div>
              <span className="text-sm text-gray-400">Drop file or <span className="text-arc-400">click to upload</span></span>
              <span className="text-xs text-gray-700">{item.hint}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Brand colors */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold text-sm text-gray-300 mb-4">Brand Colors</h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block capitalize">{key}</label>
              <div className="flex items-center gap-3 glass rounded-xl p-3 border border-white/10">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg border border-white/20" style={{ background: value }} />
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                  className="flex-1 bg-transparent text-sm font-mono text-gray-300 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="flex items-center gap-2 px-6 py-3 bg-arc-600 hover:bg-arc-500 rounded-xl font-semibold text-sm transition-all">
        <Save className="w-4 h-4" />{saved ? "Saved! ✓" : "Save Branding"}
      </button>
    </div>
  );
}
