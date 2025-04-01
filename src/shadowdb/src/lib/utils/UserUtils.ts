import { getDefaultReaderPool, getDefaultWriterPool } from "../userPools";

/**
 * Find a user by their email address
 * @param email Email to lookup
 * @param provider Optional auth provider (credentials, google, github)
 * @returns User object or null if not found
 */
export async function findUserByEmail(email: string): Promise<any | null> {
  try {
    const result = await getDefaultReaderPool().query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    return null;
  }
}

/**
 * Find a user by their ID
 * @param id User ID to lookup
 * @returns User object or null if not found
 */
export async function findUserById(id: string | number): Promise<any | null> {
  try {
    const result = await getDefaultReaderPool().query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error finding user by id:", error);
    return null;
  }
}
