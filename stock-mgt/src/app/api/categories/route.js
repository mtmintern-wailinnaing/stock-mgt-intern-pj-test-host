import { NextResponse } from "next/server";
import {
  createCategoryService,
  getAllCategoriesService,
} from "@/services/category.service";

export async function GET() {
  try {
    const categories = await getAllCategoriesService();
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load categories database registry" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const servicePayload = {
      name: body.name,
      parentId: body.parentId,
      minimumThreshold: body.minimumThreshold,
      remark: body.remark,
    };

    const result = await createCategoryService(servicePayload);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.error?.code || "ERROR",
            message: result.error?.message || "Request failed",
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: result.message,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Unexpected error",
        },
      },
      { status: 500 },
    );
  }
}
