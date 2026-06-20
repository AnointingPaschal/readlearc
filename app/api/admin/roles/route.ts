import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

// Role levels
const ROLE_NAMES: Record<number,string> = { 0:"User", 1:"Moderator", 2:"Admin", 3:"Super Admin" };

export async function GET() {
  const { data, error } = await supabaseAdmin.from("admin_roles")
    .select("*, profiles(username,display_name,avatar_color)")
    .order("role", { ascending:false });
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json((data||[]).map((r:any) => ({
    walletAddress: r.wallet_address,
    role:          r.role,
    roleName:      ROLE_NAMES[r.role] || "User",
    username:      r.profiles?.username,
    displayName:   r.profiles?.display_name,
    grantedAt:     r.granted_at,
  })));
}

export async function POST(req: NextRequest) {
  const { walletAddress, role } = await req.json();
  if (!walletAddress || role === undefined)
    return NextResponse.json({ error:"walletAddress + role required" }, { status:400 });

  if (role === 0) {
    // Remove role (back to user)
    await supabaseAdmin.from("admin_roles").delete().ilike("wallet_address", walletAddress);
    return NextResponse.json({ ok:true });
  }

  const { error } = await supabaseAdmin.from("admin_roles").upsert({
    wallet_address: walletAddress.toLowerCase(),
    role, granted_at: new Date().toISOString(),
  }, { onConflict:"wallet_address" });
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
