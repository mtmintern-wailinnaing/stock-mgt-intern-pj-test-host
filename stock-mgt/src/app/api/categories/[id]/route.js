import { NextResponse } from "next/server";
import {
  updateCategoryService,
  deleteCategoryService,
} from "@/services/category.service";

function errorResponse(error, statusCode = 400) {
  return {
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.message || "An error occurred",
      ...(error.details && { details: error.details }),
      ...(error.field && { field: error.field }),
    },
    statusCode,
  };
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        errorResponse(
          {
            code: "VALIDATION_ERROR",
            message: "Category name is required",
            field: "name",
          },
          400,
        ),
        { status: 400 },
      );
    }

    const result = await updateCategoryService(id, body);

    if (!result.success) {
      return NextResponse.json(result, { status: result.statusCode || 400 });
    }

    return NextResponse.json(result, { status: result.statusCode || 200 });
  } catch (error) {
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";
    let errorMessage = "Failed to update category";

    if (error.message.includes("not found")) {
      statusCode = 404;
      errorCode = "CATEGORY_NOT_FOUND";
      errorMessage = error.message;
    } else if (error.message.includes("already exists")) {
      statusCode = 409;
      errorCode = "DUPLICATE_CATEGORY";
      errorMessage = error.message;
    } else if (error.message.includes("required")) {
      statusCode = 400;
      errorCode = "VALIDATION_ERROR";
      errorMessage = error.message;
    }

    return NextResponse.json(
      errorResponse(
        {
          code: errorCode,
          message: errorMessage,
        },
        statusCode,
      ),
      { status: statusCode },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await deleteCategoryService(id);

    if (!result.success) {
      return NextResponse.json(result, { status: result.statusCode || 400 });
    }

    return NextResponse.json(result, { status: result.statusCode || 200 });
  } catch (error) {
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";
    let errorMessage = "Failed to delete category";

    if (error.message.includes("not found")) {
      statusCode = 404;
      errorCode = "CATEGORY_NOT_FOUND";
      errorMessage = error.message;
    } else if (
      error.message.includes("subcategories") ||
      error.message.includes("subcategory(ies)")
    ) {
      statusCode = 400;
      errorCode = "HAS_SUBCATEGORIES";
      errorMessage = error.message;
    } else if (error.message.includes("stock quantity")) {
      statusCode = 400;
      errorCode = "STOCK_EXISTS";
      errorMessage = error.message;
    }

    return NextResponse.json(
      errorResponse(
        {
          code: errorCode,
          message: errorMessage,
        },
        statusCode,
      ),
      { status: statusCode },
    );
  }
}
