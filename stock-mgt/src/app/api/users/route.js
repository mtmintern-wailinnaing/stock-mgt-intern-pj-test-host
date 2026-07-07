import { AppError } from "@/lib/errors";
import { userSchema } from "@/lib/validations/user";
import { UserService } from "@/services/user.service";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const userService = new UserService(request);
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search") || "";

    const users = await userService.getUsersService(searchQuery);
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const userService = new UserService(request);
    const body = await request.json();

    const validatedData = userSchema.parse(body);
    const result = await userService.createUserService(validatedData);

    return NextResponse.json(
      { message: "User created successfully", result },
      { status: 201 },
    );
  } catch (error) {
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
