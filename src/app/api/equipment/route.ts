import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "The equipment API has been removed. Equipment lists are provided via server-side rendering.",
    },
    { status: 410 }
  );
}
