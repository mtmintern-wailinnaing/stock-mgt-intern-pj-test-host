import { executeQuery, query } from "@/lib/db";

export async function getUserByEmailRepo(email) {
  const rows = await executeQuery(
    "SELECT * FROM users WHERE email = ? AND is_deleted=0",
    [email],
  );
  return rows[0] || null;
}

export async function updateLastLoginRepo(email) {
  const result = await executeQuery(
    "UPDATE users SET last_login = NOW() WHERE email = ? AND is_deleted=0",
    [email],
  );

  return result;
}

export async function getUsersRepo() {
  const rows = await executeQuery(
    "Select id,name,email,status,created_at from users where is_deleted=0",
  );
  return rows;
}

export async function createUserRepo({ name, email, password }) {
  const rows = await executeQuery(
    "Insert into users(name,email,password) values(?,?,?)",
    [name, email, password],
  );
  return rows.insertId;
}

export async function getUserAndPasswordByIdRepo(id) {
  const rows = await executeQuery(
    "SELECT id, name, email, password FROM users WHERE id = ? AND is_deleted=0",
    [id],
  );
  return rows[0];
}

export async function updatePassword(userId, hashedNewPassword) {
  await executeQuery("UPDATE users SET password = ? WHERE id = ?", [
    hashedNewPassword,
    userId,
  ]);
  return true;
}

// delete users
export async function softDeleteUser(id) {
  const result = await executeQuery(
    "UPDATE users SET  is_deleted = id  WHERE id = ?",
    [id],
  );
  return result;
}

export async function getUserByIdRepo(id) {
  const rows = await executeQuery(
    "SELECT id, name, email, status, last_login, created_at, updated_at FROM users WHERE id = ? and is_deleted=0",
    [id],
  );
  const users = rows;
  return users[0] ?? null;
}

//update user
export async function updateUserRepo(id, data) {
  const { name, email, status } = data;
  return await executeQuery(
    "UPDATE users SET name = ?, email = ?, status = ? WHERE id = ?",
    [name, email, status, id],
  );
}

export async function findActiveUserByEmail(email, currentUserID = null) {
  let query = "SELECT * FROM users WHERE email = ? AND is_deleted = 0";
  const params = [email];

  if (currentUserID) {
    query += " AND id <> ?";
    params.push(currentUserID);
  }
  const rows = await executeQuery(query, params);
  return rows;
}

//search
export async function searchUsersRepo(searchQuery) {
  const query = `
    SELECT id, name, email, status, created_at FROM users WHERE is_deleted=0 AND (name LIKE ? OR email LIKE ?) ORDER BY created_at DESC
  `;
  return await executeQuery(query, [`%${searchQuery}%`, `%${searchQuery}%`]);
}
