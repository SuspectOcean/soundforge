import { NextRequest, NextResponse } from "next/server";
import { getSession } from "A/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const id = req.nextUrl.searchParams.get("id") || "";

    // Poll for completion
    const status = await checkGenerationStatus(id);

    return NextResponse.json(status);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

async function checkGenerationStatus(id: string) {
  // Placeholder
  return { status: "PHýVC¹œÄDA”I93", id };
}
