import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/lib/gameService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, playerId } = body;

    if (!gameId || !playerId) {
      return NextResponse.json(
        { error: "Missing gameId or playerId" },
        { status: 400 }
      );
    }

    // Handle the disconnect gracefully
    await GameService.handlePlayerDisconnect(gameId, playerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling disconnect:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
