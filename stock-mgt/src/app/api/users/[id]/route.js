import { AppError } from "@/lib/errors";
import { userEditSchema } from "@/lib/validations/user";
import { UserService } from "@/services/user.service";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const userService = new UserService(request);
    const { id } = await params;
    const body = await request.json();
    const validatedData = userEditSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (body.status !== undefined) {
      if (typeof body.status === "boolean") {
        validatedData.status = body.status ? 1 : 0;
      } else {
        validatedData.status = Number(body.status) === 1 ? 1 : 0;
      }
    }

    await userService.updateUserService(id, validatedData);
    return NextResponse.json(
      { success: true, message: "User updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.info(error);
    if (error.name === "ZodError") {
      return NextResponse.json({ errors: error.format() }, { status: 400 });
    }

    if (error instanceof AppError) {
      const errorField = error.field || "email";

      return NextResponse.json(
        {
          errors: {
            [errorField]: { _errors: [error.message] },
          },
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { message: "Internal server error. Please try again later." },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const userService = new UserService(request);

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    await userService.deleteUserService(id);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.info(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
