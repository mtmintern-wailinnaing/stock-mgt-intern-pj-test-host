import { AppError } from "@/lib/errors";
import bcrypt from "bcryptjs";
import {
  createUserRepo,
  getUserByEmailRepo,
  getUsersRepo,
  softDeleteUser,
  getUserByIdRepo,
  updateUserRepo,
  findActiveUserByEmail,
  searchUsersRepo,
} from "@/repositories/user.repo";
import { authorizeRequest } from "@/lib/utils/auth";

export class UserService {
  constructor(request) {
    this.currentUser = authorizeRequest(request);
  }
  async getUsersService(searchQuery = "") {
    if (searchQuery && searchQuery.trim() !== "") {
      return await searchUsersRepo(searchQuery);
    }
    return await getUsersRepo();
  }

  async createUserService(data) {
    const user = await getUserByEmailRepo(data.email);

    if (user) {
      throw new AppError("Email already exists", 400, "email_exist");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    return await createUserRepo({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });
  }

  // delete user
  async deleteUserService(id) {
    const result = await softDeleteUser(id);
    return result;
  }

  // update user
  async updateUserService(id, data) {
    const { name, email, status } = data;
    if (!id) throw new AppError("User ID is required", 400, "id");

    const existingUser = await getUserByIdRepo(id);
    if (!existingUser) {
      throw new AppError("User not found", 400, "user_not_found");
    }
    const emailCheck = await findActiveUserByEmail(email, id);
    if (emailCheck.length > 0) {
      throw new AppError("Email already exist", 400, "email_exist");
    }

    return await updateUserRepo(id, { name, email, status });
  }
}
