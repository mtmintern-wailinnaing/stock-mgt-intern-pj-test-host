import {
  getUserAndPasswordByIdRepo,
  getUserByEmailRepo,
  updatePassword,
  // updateLastLoginRepo,
} from "@/repositories/user.repo";
// Adjust repo name/paths as needed
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "@/lib/errors";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new AppError("JWT secret is missing", 401, "jwt_secret_missing");
}

export async function login(data) {
  const user = await getUserByEmailRepo(data.email);
  if (!user) {
    throw new AppError(
      "This selected Email Address doesn't exist.",
      401,
      "email",
    );
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);

  if (!isValidPassword) {
    throw new AppError("Invalid password. Please try again.", 401, "password");
  }

  // await updateLastLoginRepo(user.email);
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "8h" },
  );

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name },
    message: "Login Successful",
  };
}
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await getUserAndPasswordByIdRepo(userId);
  if (!user) {
    throw new AppError("User not found.", 404, "currentPassword");
  }

  const dbPassword = user.password;
  const cleanInputPassword = currentPassword;
  let isMatch = false;

  try {
    isMatch = await bcrypt.compare(cleanInputPassword, dbPassword);
  } catch (e) {
    isMatch = false;
  }

  if (!isMatch) {
    throw new AppError("Incorrect current password.", 400, "currentPassword");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  await updatePassword(userId, hashedNewPassword);

  return { success: true, message: "Password changed successfully" };
}

export const authService = {
  changePassword,
  login,
};
