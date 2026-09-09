import { NextResponse } from "next/server";
import { registerAndAnchor, chainStatus } from "@/lib/chain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(chainStatus());
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    did: string;
    pubkeyHex: string;
    credHash: string;
  };
  if (!body.did || !body.pubkeyHex || !body.credHash) {
    return NextResponse.json({ error: "invalid_anchor" }, { status: 400 });
  }
  const chain = await registerAndAnchor(body);
  return NextResponse.json(chain);
}
