import { NextResponse } from "next/server";
import { loadSession, saveSession } from "@/lib/store";
import type { Presentation } from "@/lib/types";
import { verifyPresentation } from "@/lib/verify-presentation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await loadSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (Date.now() > session.expiresAt) {
    session.status = "expired";
    await saveSession(session);
    return NextResponse.json(session);
  }
  if (session.status !== "pending") {
    return NextResponse.json(session);
  }

  const body = (await req.json()) as
    | { fail?: true; reason?: string }
    | Presentation;

  if ("fail" in body && body.fail) {
    session.status = "fail";
    session.result = {
      ephemeralDid: "",
      disclosed: {},
      predicates: { ageGte: false, gpaGte: false },
      verifiedAt: Date.now(),
      reason: body.reason ?? "predicates_unsatisfied",
    };
    await saveSession(session);
    return NextResponse.json(session);
  }

  const presentation = body as Presentation;
  if (presentation.sessionId !== id) {
    return NextResponse.json({ error: "session_mismatch" }, { status: 400 });
  }

  const checked = await verifyPresentation(presentation, session.request);
  if (!checked.ok) {
    session.status = "fail";
    session.result = {
      ephemeralDid: presentation.ephemeralDid,
      disclosed: {},
      predicates: { ageGte: false, gpaGte: false },
      verifiedAt: Date.now(),
      reason: checked.reason,
    };
    await saveSession(session);
    return NextResponse.json(session);
  }

  session.status = "pass";
  session.result = {
    ephemeralDid: checked.ephemeralDid,
    disclosed: checked.disclosed,
    predicates: { ageGte: true, gpaGte: true },
    verifiedAt: Date.now(),
  };
  await saveSession(session);
  return NextResponse.json(session);
}
