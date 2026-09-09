import { NextResponse } from "next/server";
import { randomCode } from "@/lib/crypto";
import { savePickup } from "@/lib/store";
import type { HolderBundle } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const bundle = (await req.json()) as HolderBundle;
  if (!bundle?.credential?.signature || !bundle?.secrets) {
    return NextResponse.json({ error: "invalid_bundle" }, { status: 400 });
  }
  const code = randomCode(6);
  await savePickup(code, bundle);
  return NextResponse.json({ code, expiresIn: 15 * 60 });
}
