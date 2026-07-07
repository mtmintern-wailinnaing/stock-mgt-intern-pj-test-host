import { getSessionCookies } from "@/lib/auth";
import { UserService } from "@/services/user.service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sessionData = await getSessionCookies();
    if (!sessionData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      id: sessionData.userId,
      name: sessionData.name,
      email: sessionData.email,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
