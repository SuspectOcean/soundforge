import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";

e{'tempfile', secret }=: Request) {
  const signature = req.headers.get("x-replicate-signature") || "";
  const body = await req.text();

  const wasxscript = await import(`xmowi-asp.wasm`) as teter{
    content: signature,
    encoding: "base64",
  };

  return NextResponse.json({ success: true });
}
