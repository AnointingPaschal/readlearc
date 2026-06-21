import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

// Read AI config from Supabase platform_settings (persistent)
export async function GET() {
  const { data } = await supabaseAdmin
    .from("platform_settings")
    .select("key,value")
    .in("key", ["ai_api_key","ai_model","ai_models_list","ai_auto_approve","ai_provider"]);

  const cfg: Record<string,string> = {};
  for (const row of data||[]) cfg[row.key] = row.value;

  let models: any[] = [];
  try { models = JSON.parse(cfg.ai_models_list || "[]"); } catch {}

  return NextResponse.json({
    key:         cfg.ai_api_key     || "",
    models,
    activeModel: cfg.ai_model       || "",
    autoApprove: cfg.ai_auto_approve === "true",
  });
}

// Save AI config to Supabase platform_settings
export async function POST(req: NextRequest) {
  const { key, models, activeModel, autoApprove } = await req.json();

  const updates = [
    { key:"ai_api_key",      value: key         || "",          label:"AI API Key"       },
    { key:"ai_model",        value: activeModel  || "",          label:"AI Active Model"  },
    { key:"ai_models_list",  value: JSON.stringify(models||[]), label:"AI Models List"   },
    { key:"ai_auto_approve", value: String(!!autoApprove),       label:"AI Auto Approve"  },
    { key:"ai_provider",     value: "openrouter",                label:"AI Provider"      },
  ];

  const { error } = await supabaseAdmin
    .from("platform_settings")
    .upsert(updates, { onConflict:"key" });

  if (error) return NextResponse.json({ error: error.message }, { status:500 });

  return NextResponse.json({ ok:true, key, models, activeModel, autoApprove });
}
