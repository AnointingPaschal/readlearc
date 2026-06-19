
import { NextRequest, NextResponse } from "next/server";
import { getModerationStatus, setModerationStatus, getAllHidden, getAllFeatured, getAllModerationStatuses } from "../../../lib/store";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("id");
  const action    = searchParams.get("action")||"all";
  if (action==="hidden")   return NextResponse.json(getAllHidden());
  if (action==="featured") return NextResponse.json(getAllFeatured());
  if (articleId)           return NextResponse.json(getModerationStatus(articleId));
  return NextResponse.json(getAllModerationStatuses());
}
export async function POST(req: NextRequest) {
  const { articleId, status, reason } = await req.json();
  setModerationStatus(articleId, status, reason);
  return NextResponse.json({ ok: true, articleId, status });
}
