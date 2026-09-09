import { NextResponse } from "next/server";
import { loadSession, saveSession } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await loadSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (session.status === "pending" && Date.now() > session.expiresAt) {
    session.status = "expired";
    await saveSession(session);
  }

  return NextResponse.json(session);
}
