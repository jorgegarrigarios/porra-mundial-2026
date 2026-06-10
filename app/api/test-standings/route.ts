import { NextResponse } from "next/server";
import { footballFetch } from "@/lib/api/football";

export async function GET() {
  try {
    const data = await footballFetch(
      "/standings?league=1&season=2026"
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}