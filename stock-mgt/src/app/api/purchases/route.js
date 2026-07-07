import { NextResponse } from "next/server";
import { getAllPurchasesService } from "@/services/purchase.service";

export async function GET() {
  try {
    const purchases = await getAllPurchasesService();
    return NextResponse.json(purchases, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load purchases database registry" },
      { status: 500 },
    );
  }
}
