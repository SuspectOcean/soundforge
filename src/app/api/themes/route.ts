import { NextResponse, NextRequest } from "next/server";
import { auth } from "A/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { auth: { user } } = await auth() || {};

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const themes = await prisma.theme.findMany({
      where: { userId: user.id },
    });
    return NextResponse.json(themes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch themes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { auth: { user } } = await auth() || {};

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const theme = await prisma.theme.create({
      data: {
        ...body,
        userId: user.id,
      },
    });
    return NextResponse.json(theme, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create theme" },
      { status: 500 }
    );
  }
}
