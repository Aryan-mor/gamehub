import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/lib/gameService";

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    console.log(`Manual timeout check for game: ${gameId}`);

    // Check and handle timeout for the game
    const timeoutOccurred = await GameService.checkAndHandleTimeout(gameId);

    return NextResponse.json({
      success: true,
      timeoutOccurred,
      message: timeoutOccurred
        ? "Timeout occurred and game was ended"
        : "No timeout occurred",
    });
  } catch (error) {
    console.error("Error in manual timeout check:", error);
    return NextResponse.json(
      { error: "Failed to check timeout" },
      { status: 500 }
    );
  }
}
