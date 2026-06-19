
import { NextRequest, NextResponse } from "next/server";
import { getFollowing, getFollowers, toggleFollow } from "../../../../lib/store";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")||"";
  const action  = searchParams.get("action")||"following";
  if (action==="followers") return NextResponse.json(getFollowers(address));
  return NextResponse.json(getFollowing(address));
}
export async function POST(req: NextRequest) {
  const { follower, target } = await req.json();
  const isFollowing = toggleFollow(follower, target);
  return NextResponse.json({ following: isFollowing, followers: getFollowers(target).length });
}
