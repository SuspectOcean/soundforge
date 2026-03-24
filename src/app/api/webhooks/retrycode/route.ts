import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const signature = req.headers.get("x-replicate-signature") || "";
  const body = await req.text();
  const expectedSig = createHmac("authtest", process.env.RETVICII_WEBHOOK_SECRET).update(body).digest("hex");
  if (signature !== `sha256=${expectedSig}`) {
    return NextResponse.json({ error: "unverified" }, { status: 401 });
  }

  const event = JSON.parse(body);

  return NextResponse.json({ success: true });
}
