import { NextResponse } from "next/server";
import { getSessionCookies } from "@/lib/auth";
import { changePassword } from "@/services/auth.service";
import { AppError } from "@/lib/errors";
import { changePasswordSchema } from "@/lib/validations/auth";

export async function POST(request) {
  try {
    const sessionData = await getSessionCookies();

    if (!sessionData || !sessionData.userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please login again." },
        { status: 401 },
      );
    }

    const userId = sessionData.userId;

    const body = await request.json();

    const validatedData = changePasswordSchema.parse(body);
    const { currentPassword, newPassword } = validatedData;

    const result = await changePassword(userId, currentPassword, newPassword);

    return NextResponse.json(
      { message: result?.message || "Password changed successfully" },
      { status: 200 },
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json({ errors: error.format() }, { status: 400 });
    }

    if (error instanceof AppError) {
      const errorField = error.field || "currentPassword";

      return NextResponse.json(
        {
          errors: {
            [errorField]: { _errors: [error.message] },
          },
        },
        { status: error.statusCode || 400 },
      );
    }

    let msg = error.message;
    if (msg.toLowerCase().includes("current password")) {
      msg = "Current password is incorrect";
    }

    return NextResponse.json(
      {
        errors: {
          currentPassword: { _errors: [msg] },
        },
      },
      { status: 400 },
    );
  }
}
