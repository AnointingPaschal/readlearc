
import { NextRequest, NextResponse } from "next/server";
import { getAIState, setAIState } from "../../../../lib/store";
export async function GET() { return NextResponse.json(getAIState()); }
export async function POST(req: NextRequest) {
  const body = await req.json();
  setAIState(body);
  return NextResponse.json({ ok: true, ...getAIState() });
}
