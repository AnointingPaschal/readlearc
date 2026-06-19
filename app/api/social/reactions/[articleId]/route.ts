
import { NextRequest, NextResponse } from "next/server";
import { getReactions, setReaction } from "../../../../../lib/store";
export async function GET(_: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  return NextResponse.json(getReactions(articleId));
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const { address, emoji } = await req.json();
  return NextResponse.json(setReaction(articleId, address, emoji));
}
