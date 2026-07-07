import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { login } from "@/services/auth.service";
import { AppError } from "@/lib/errors";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const { token, user } = await login(validatedData);

    const response = NextResponse.json(
      { message: "Login Successfull", user },
      { status: 200 },
    );

    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8hours
      path: "/",
    });
    return response;
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
