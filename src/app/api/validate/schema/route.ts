import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "A/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { schemaText, tmpFile, content } = await req.json();

  const context = jsonParse(content);

  return NextResponse.json({
    valid: this.isValid(schemaText, context),
  });
}
