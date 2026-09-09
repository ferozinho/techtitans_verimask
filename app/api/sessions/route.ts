import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AGE_THRESHOLD, GPA_TENTHS_THRESHOLD, PRESENTATION_TTL_MS } from "@/lib/constants";
import { saveSession, usingRedis } from "@/lib/store";
import type { FieldKey, VerifySession } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    disclose?: FieldKey[];
    verifierDid?: string;
    ageGte?: number;
    gpaGte?: number;
  };

  const now = Date.now();
  const session: VerifySession = {
    id: randomUUID(),
    createdAt: now,
    expiresAt: now + PRESENTATION_TTL_MS,
    request: {
      ageGte: body.ageGte ?? AGE_THRESHOLD,
      gpaGte: body.gpaGte ?? GPA_TENTHS_THRESHOLD,
      disclose: body.disclose ?? ["degree"],
      verifierDid: body.verifierDid ?? "did:verimask:kiosk",
    },
    status: "pending",
  };

  await saveSession(session);

  return NextResponse.json({
    session,
    durable: usingRedis(),
  });
}
