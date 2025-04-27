import { getDefaultWriterPool, getDefaultReaderPool } from "../userPools";

/**
 * Terminates all connections to a specific database except the current connection
 * @param dbName Name of the database to terminate connections for
 * @returns Object with success status and count of terminated connections
 */

export async function terminateDbConnections(
  dbName: string
): Promise<{ success: boolean; count: number }> {
  try {
    const result = await getDefaultWriterPool().query(
      `
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid();
      `,
      [dbName]
    );

    return {
      success: true,
      count: result.rowCount === null ? 0 : result.rowCount,
    };
  } catch (error) {
    console.error("Error terminating database connections:", error);
    throw error;
  }
}

/**
 * Checks if a database exists
 * @param dbName Database name to check
 * @returns Boolean indicating if database exists
 */
export async function databaseExists(
  dbName: string,
  tenancy_type: "shared" | "isolated" | "all" = "all"
): Promise<boolean> {
  try {
    console.log("dbName", dbName);
    let result;
    if (tenancy_type === "shared" || tenancy_type === "all") {
      result = await getDefaultReaderPool().query(
        `
        SELECT 1 FROM pg_database WHERE datname = $1
      `,
        [dbName]
      );
    }
    if (
      tenancy_type === "isolated" ||
      (tenancy_type === "all" && result && result.rowCount === 0)
    ) {
      result = await getDefaultReaderPool().query(
        `
        SELECT * FROM databases WHERE name = $1 and is_replica = false
      `,
        [dbName]
      );
    }
    console.log("result", result);
    if (!result) return false;
    return (result.rowCount === null ? 0 : result.rowCount) > 0;
  } catch (error) {
    console.error("Error checking if database exists:", error);
    throw error;
  }
}

/**
 * Renames a PostgreSQL database
 * @param oldName Current database name
 * @param newName New database name
 * @returns Object with success status and message
 */
export async function renameDatabase(
  oldName: string,
  newName: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check for protected system databases
    const protectedDbs = ["postgres", "template0", "template1"];
    if (protectedDbs.includes(oldName)) {
      return {
        success: false,
        message: `Cannot rename protected system database "${oldName}"`,
      };
    }

    // First check if old database exists
    const oldExists = await databaseExists(oldName);
    if (!oldExists) {
      return {
        success: false,
        message: `Database "${oldName}" does not exist`,
      };
    }

    // Check if new name already exists
    const newExists = await databaseExists(newName);
    if (newExists) {
      return {
        success: false,
        message: `Database "${newName}" already exists`,
      };
    }

    //check if user has access to the database

    const userHasAccess = await CheckIfUserHasAccess(userId, oldName, "admin");
    if (!userHasAccess) {
      return {
        success: false,
        message: `User does not have access to database "${oldName}"`,
      };
    }

    // Validate new database name format

    if (!newName.match(/^[a-zA-Z0-9_]+$/)) {
      return {
        success: false,
        message: `Invalid database name "${newName}". Only alphanumeric characters and underscores are allowed`,
      };
    }

    // First terminate all connections
    await terminateDbConnections(oldName);

    // Then rename the database
    await getDefaultWriterPool().query(
      `ALTER DATABASE "${oldName}" RENAME TO "${newName}";`
    );

    return {
      success: true,
      message: `Database renamed from ${oldName} to ${newName}`,
    };
  } catch (error) {
    console.error("Error renaming database:", error);
    return {
      success: false,
      message: `Error renaming database: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Updates database name references in related tables after a database rename
 * @param oldName Previous database name
 * @param newName New database name
 * @param userId User ID who owns or initiated the rename
 * @returns Object with success status, message, and update counts
 */
export async function RenameReferences(
  oldName: string,
  newName: string,
  userId: string
): Promise<{
  success: boolean;
  message: string;
  updates: { databases: number };
}> {
  try {
    // Input validation
    if (!oldName || oldName.trim() === "") {
      throw new Error("Old database name cannot be empty");
    }

    if (!newName || newName.trim() === "") {
      throw new Error("New database name cannot be empty");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Update database references in the databases table
    const databaseResult = await getDefaultWriterPool().query(
      `UPDATE databases 
         SET name = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE name = $2
         RETURNING id`,
      [newName, oldName]
    );

    const databasesUpdated = databaseResult.rowCount || 0;

    return {
      success: true,
      message: `Updated ${databasesUpdated} database references from "${oldName}" to "${newName}"`,
      updates: {
        databases: databasesUpdated,
      },
    };
  } catch (error) {
    console.error("Error updating database references:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error occurred while updating database references";

    throw new Error(`Failed to update database references: ${errorMessage}`);
  }
}

/**
 * Checks if a user has access to a specific database
 * @param userId ID of the user to check
 * @param dbName Name of the database to check access for
 * @param requiredAccessLevel Optional minimum access level required (default: any access)
 * @returns Boolean indicating if user has the required access
 */
export async function CheckIfUserHasAccess(
  userId: string,
  dbName: string,
  requiredAccessLevel?: "admin" | "write" | "read"
): Promise<boolean> {
  try {
    if (!userId || !dbName) {
      return false;
    }

    // Query to join databases and user_databases tables to check access
    let query = `
        SELECT ud.access_level 
        FROM databases d
        JOIN user_databases ud ON d.id = ud.database_id
        WHERE d.name = $1 AND ud.user_id = $2
      `;

    const params = [dbName, userId];

    // If specific access level is required, add it to the query
    if (requiredAccessLevel) {
      query += ` AND ud.access_level = $3`;
      params.push(requiredAccessLevel);
    }

    const result = await getDefaultReaderPool().query(query, params);

    // Check if any rows were returned (user has access)
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error("Error checking if user has access to database:", error);
    // Return false on error instead of throwing to make this function more resilient
    return false;
  }
}
