import { NextRequest, NextResponse } from "next/server";
import { getNextAvailableSlot } from "@/lib/scheduling/available-slots";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nutriId = searchParams.get("nutriId");

    if (!nutriId) {
      return NextResponse.json(
        { error: "nutriId is required" },
        { status: 400 }
      );
    }

    const nextSlot = await getNextAvailableSlot(nutriId);

    return NextResponse.json({ slot: nextSlot });
  } catch (error) {
    console.error("Error fetching next available slot:", error);
    return NextResponse.json(
      { error: "Failed to fetch next available slot" },
      { status: 500 }
    );
  }
}
