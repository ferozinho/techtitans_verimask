import { NextResponse } from "next/server";
import { logVerification } from "@/lib/chain";
import { verificationReceipt } from "@/lib/receipt";
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
      hiddenKeys: [],
      labels: {},
      verifiedAt: Date.now(),
      reason: body.reason ?? "holder_declined",
    };
    await saveSession(session);
    return NextResponse.json(session);
  }

  const presentation = body as Presentation;
  if (presentation.sessionId !== id) {
    return NextResponse.json({ error: "session_mismatch" }, { status: 400 });
  }

  const checked = verifyPresentation(presentation, session.request);
  const passed = checked.ok;
  const issuerDid = presentation.credential.issuerDid;
  const claimTypes = session.request.disclose;
  const receiptHash = verificationReceipt({
    sessionId: id,
    verifierDid: session.request.verifierDid,
    issuerDid,
    claimTypes,
    passed,
  });
  const chain = await logVerification({
    receiptHash,
    verifierDid: session.request.verifierDid,
    issuerDid,
    claimTypes,
    passed,
  });

  if (!checked.ok) {
    session.status = "fail";
    session.result = {
      ephemeralDid: presentation.ephemeralDid,
      disclosed: {},
      hiddenKeys: presentation.credential.schema.map((c) => c.id),
      labels: {},
      verifiedAt: Date.now(),
      reason: checked.reason,
      chain,
    };
    await saveSession(session);
    return NextResponse.json(session);
  }

  session.status = "pass";
  session.result = {
    ephemeralDid: checked.ephemeralDid,
    disclosed: checked.disclosed,
    hiddenKeys: checked.hidden,
    labels: checked.labels,
    verifiedAt: Date.now(),
    chain,
  };
  await saveSession(session);
  return NextResponse.json(session);
}
