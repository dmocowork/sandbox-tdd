import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    ts: new Date().toISOString(),
  });
}
