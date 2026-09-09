import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { PRESENTATION_TTL_MS } from "@/lib/constants";
import { packById } from "@/lib/schema";
import { saveSession, usingRedis } from "@/lib/store";
import type { VerifySession } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    packId?: string;
    disclose?: string[];
    verifierDid?: string;
  };

  const pack = packById(body.packId ?? "source");
  const now = Date.now();
  const session: VerifySession = {
    id: randomUUID(),
    createdAt: now,
    expiresAt: now + PRESENTATION_TTL_MS,
    request: {
      packId: pack.id,
      disclose: body.disclose?.length ? body.disclose : pack.required,
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
