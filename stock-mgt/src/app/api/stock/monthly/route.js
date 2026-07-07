import { NextResponse } from "next/server";
import { createMonth } from "@/services/stock.service";
import { AppError } from "@/lib/errors";

export async function POST(request) {
  try {
    const body = await request.json();
    const { month, year } = body;

    const result = await createMonth({ month, year });

    return NextResponse.json(
      {
        message: result.message,
        id: result.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("API POST /api/stock/monthly Error:", error);

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
          global: {
            _errors: [
              error.message || "Internal Server Error. Failed to store data.",
            ],
          },
        },
      },
      { status: 500 },
    );
  }
}
