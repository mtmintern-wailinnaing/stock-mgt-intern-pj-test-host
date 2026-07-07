import { NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";
import { saveStockBatchSchema } from "@/lib/validations/product";
import { AppError } from "@/lib/errors";

export async function POST(request) {
  try {
    const productService = new ProductService(request);
    const body = await request.json();
    const validation = saveStockBatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation Failed",
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await productService.processStockBatch(validation.data);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
