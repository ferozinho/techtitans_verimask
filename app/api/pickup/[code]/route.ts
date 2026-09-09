import { NextResponse } from "next/server";
import { takePickup } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const bundle = await takePickup(code);
  if (!bundle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(bundle);
}
