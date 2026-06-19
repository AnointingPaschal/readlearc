
import { NextRequest, NextResponse } from "next/server";
import { getComments, addComment, deleteComment, editComment } from "../../../../../lib/store";
import { randomUUID } from "crypto";

export async function GET(_: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  return NextResponse.json(getComments(articleId));
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const body = await req.json();
  const comment = addComment({ id: randomUUID(), articleId, authorAddress: body.authorAddress||"0x0", authorName: body.authorName, text: body.text, timestamp: Date.now(), parentId: body.parentId });
  return NextResponse.json(comment);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const { commentId, text } = await req.json();
  editComment(articleId, commentId, text);
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const { searchParams } = new URL(req.url);
  deleteComment(articleId, searchParams.get("commentId")||"");
  return NextResponse.json({ ok: true });
}
