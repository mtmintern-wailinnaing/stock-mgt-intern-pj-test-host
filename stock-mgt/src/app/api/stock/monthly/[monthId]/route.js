import { NextResponse } from "next/server";
import { getStockReportByMonth } from "@/services/stock.service";
import { AppError } from "@/lib/errors";

export async function GET(request, { params }) {
  try {
    const { monthId } = await params;

    if (!monthId) {
      throw new AppError("Month ID is required.", 400, "monthId");
    }

    const products = await getStockReportByMonth(monthId);

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
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
              error.message || "Failed to retrieve monthly stock data.",
            ],
          },
        },
      },
      { status: 500 },
    );
  }
}
