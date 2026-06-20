"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface Brand {
  brand_color:   string;
  bg_color:      string;
  text_color:    string;
  accent_color:  string;
  card_color:    string;
  border_color:  string;
  brand_name:    string;
  brand_tagline: string;
}

const defaults: Brand = {
  brand_color:   "#6d28d9",
  bg_color:      "#f9f8f7",
  text_color:    "#18181b",
  accent_color:  "#059669",
  card_color:    "#ffffff",
  border_color:  "#e5e3e1",
  brand_name:    "Readlearc",
  brand_tagline: "Pay per word. Own every read.",
};

const Ctx = createContext<{ brand: Brand; setBrand: (b: Partial<Brand>) => void }>(
  { brand: defaults, setBrand:()=>{} }
);

function applyBrand(b: Brand) {
  if (typeof document === "undefined") return;
  const r = document.documentElement.style;
  r.setProperty("--brand",       b.brand_color);
  r.setProperty("--brand-d",     darken(b.brand_color, 15));
  r.setProperty("--brand-l",     lighten(b.brand_color, 20));
  r.setProperty("--brand-muted", hex2rgba(b.brand_color, 0.08));
  r.setProperty("--brand-border",hex2rgba(b.brand_color, 0.22));
  r.setProperty("--bg",          b.bg_color);
  r.setProperty("--bg-alt",      darken(b.bg_color, 5));
  r.setProperty("--bg-card",     b.card_color);
  r.setProperty("--text",        b.text_color);
  r.setProperty("--text-2",      hex2rgba(b.text_color, 0.85));
  r.setProperty("--text-3",      hex2rgba(b.text_color, 0.55));
  r.setProperty("--text-4",      hex2rgba(b.text_color, 0.35));
  r.setProperty("--accent",      b.accent_color);
  r.setProperty("--border",      b.border_color);
  r.setProperty("--border-2",    darken(b.border_color, 10));
}

function hex2rgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function darken(hex: string, pct: number) {
  const f = (v: number) => Math.max(0, Math.round(v * (1 - pct/100)));
  try {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return "#"+[f(r),f(g),f(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
  } catch { return hex; }
}
function lighten(hex: string, pct: number) {
  const f = (v: number) => Math.min(255, Math.round(v + (255-v)*pct/100));
  try {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return "#"+[f(r),f(g),f(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
  } catch { return hex; }
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, _setBrand] = useState<Brand>(defaults);

  useEffect(() => {
    fetch("/api/brand").then(r=>r.json()).then((d: Partial<Brand>) => {
      const merged = { ...defaults, ...d };
      _setBrand(merged);
      applyBrand(merged);
    }).catch(()=>{});
  }, []);

  const setBrand = useCallback((updates: Partial<Brand>) => {
    _setBrand(prev => {
      const next = { ...prev, ...updates };
      applyBrand(next);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ brand, setBrand }}>{children}</Ctx.Provider>;
}

export const useBrand = () => useContext(Ctx);
