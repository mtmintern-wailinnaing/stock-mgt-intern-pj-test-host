import { NextResponse } from "next/server";
import { monthService } from "@/services/stock.service";
import { getSessionCookies } from "@/lib/auth";
import { AppError } from "@/lib/errors";

export async function GET() {
  try {
    const rows = await monthService.getAllMonths();
    return NextResponse.json(rows);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      { message: error.message || "Failed to retrieve months." },
      { status: statusCode },
    );
  }
}

export async function POST(request) {
  try {
    //get user id from session
    const sessionData = await getSessionCookies();
    if (!sessionData || !sessionData.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { month, year } = body;

    const result = await monthService.createMonth({
      month,
      year,
      createdBy: sessionData.userId,
    });

    return NextResponse.json(
      { id: result.id, message: result.message },
      { status: 201 },
    );
  } catch (error) {
    console.error("API POST /api/stock/months Error:", error);

    if (error instanceof AppError) {
      const errorField = error.field || "global";
      return NextResponse.json(
        {
          errors: {
            [errorField]: { _errors: [error.message] },
          },
        },
        { status: error.statusCode || 400 },
      );
    }

    return NextResponse.json(
      {
        errors: {
          global: { _errors: [error.message || "Internal Server Error."] },
        },
      },
      { status: 500 },
    );
  }
}
