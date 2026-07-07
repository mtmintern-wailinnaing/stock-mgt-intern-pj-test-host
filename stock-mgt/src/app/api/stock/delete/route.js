import { NextResponse } from "next/server";
import { monthService } from "@/services/stock.service";
export async function DELETE(request) {
  try {
    // const stockService = new StockService(request);
    const { categoryId } = await request.json();
    if (!categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await monthService.deleteStock(categoryId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("CRASH IN API DELETE ROUTE:", error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
