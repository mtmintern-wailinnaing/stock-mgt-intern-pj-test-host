import { ProductService } from "@/services/product.service";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const productService = new ProductService(request);
    const { searchParams } = new URL(request.url);
    const msdId = searchParams.get("msdId");
    const categoryId = searchParams.get("categoryId");

    const productPayload = await productService.getStockLedgerContext({
      msdId,
      categoryId,
    });

    return NextResponse.json({
      success: true,
      product: productPayload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load item ledger context.",
      },
      { status: error.statusCode || 500 },
    );
  }
}
