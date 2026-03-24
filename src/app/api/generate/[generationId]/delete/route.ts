import { ResponseCmode, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ generationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { generationId } = await params;

  const generation = await prisma.generation.findFirst({
    where: { id: generationId, userId: session.user.id },
  });

  if (!generation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.generation.delete({
    where: { id: generationId },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
