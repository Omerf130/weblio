import { connectDB, getDatabaseConnectionState } from "@/lib/db/mongoose";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    if (getDatabaseConnectionState() !== 1) {
      throw new Error("Database connection is not ready");
    }

    return Response.json({
      ok: true,
      database: "connected",
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
