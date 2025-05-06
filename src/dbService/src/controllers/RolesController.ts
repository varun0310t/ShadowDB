import { Request, Response } from "express";
import { getDefaultReaderPool, getDefaultWriterPool } from "../lib/Getpools";
import { promisify } from "util";
import { exec } from "child_process";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

const execAsync = promisify(exec);

// Helper function to create PgPool password entry
async function createPgPoolPasswordEntry(
  username: string,
  password: string
): Promise<string> {
  return (
    "md5" +
    crypto
      .createHash("md5")
      .update(password + username)
      .digest("hex")
  );
}

const CreateNewRole = async (req: Request, res: Response) => {
  try {
    const { database_id, userID } = req.body;
    const userinfoquery = "select role_password,email from users where id=$1";
    const uservalues = [userID];
    const userResult = await getDefaultReaderPool().query(
      userinfoquery,
      uservalues
    );
    const role_password = userResult.rows[0].role_password;
    const userEmail = userResult.rows[0].email;
    // Validate required inputs
    if (!database_id) {
      res.status(400).json({
        success: false,
        message:
          "Missing required parameters: database_id, userEmail, and role_password are required",
      });
      return;
    }

    // Get database information
    const databaseinfoquery = "SELECT * FROM databases WHERE id=$1";
    const values = [database_id];
    const databaseInforesult = await getDefaultReaderPool().query(
      databaseinfoquery,
      values
    );

    if (databaseInforesult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Database not found",
      });
      return;
    }

    const databaseinfo = databaseInforesult.rows[0];
    const {
      container_name: containerName,
      name: databaseName,
      password,
    } = databaseinfo;

    // Get PgPool information
    const pgpoolquery = "SELECT * FROM pgpool_instances WHERE id=$1";
    const pgpoolvalues = [databaseinfo.pgpool_id];
    const pgpoolinforesult = await getDefaultReaderPool().query(
      pgpoolquery,
      pgpoolvalues
    );

    if (pgpoolinforesult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "PgPool instance not found",
      });
    }

    const pgpoolinfo = pgpoolinforesult.rows[0];
    const {
      container_name: pgpoolContainerName,
      volume_name: pgpoolVolumeName,
    } = pgpoolinfo;

    try {
      // 1. Create role in PostgreSQL database
      console.log(`Creating role for: ${userEmail}`);

      // Create role with a single-line command
      const createRoleCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} psql -U postgres -c "CREATE ROLE \\\"${userEmail}\\\" WITH LOGIN PASSWORD '${role_password}'; GRANT CONNECT ON DATABASE ${databaseName} TO \\\"${userEmail}\\\";"`;

      const { stdout: createOutput, stderr: createError } = await execAsync(
        createRoleCmd
      );
      console.log(`Role creation output: ${createOutput}`);
      if (createError) console.log(`Role creation stderr: ${createError}`);

      // Grant privileges with a single-line command
      const grantPrivilegesCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} psql -U postgres -d ${databaseName} -c "GRANT ALL PRIVILEGES ON SCHEMA public TO \\\"${userEmail}\\\"; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO \\\"${userEmail}\\\"; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO \\\"${userEmail}\\\"; GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO \\\"${userEmail}\\\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO \\\"${userEmail}\\\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO \\\"${userEmail}\\\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO \\\"${userEmail}\\\";"`;

      const { stdout: roleOutput, stderr } = await execAsync(
        grantPrivilegesCmd
      );
      console.log(`Role privileges output: ${roleOutput}, stderr: ${stderr}`);

      // 2. Add user to PgPool authentication
      console.log(`Adding user to PgPool: ${userEmail}`);

      // Generate MD5 password hash for pgpool
      const md5Password = await createPgPoolPasswordEntry(
        userEmail,
        role_password
      );

      // Create temp directory for PgPool configuration
      const tempDir = path.join(os.tmpdir(), `pgpool-user-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      // Get current pool_passwd content
      await execAsync(
        `docker run --rm -v ${pgpoolVolumeName}:/etc/pgpool -v ${tempDir}:/tmp alpine sh -c "cat /etc/pgpool/pool_passwd > /tmp/current_pool_passwd || echo '' > /tmp/current_pool_passwd"`
      );

      // Read current content
      let currentPasswd = "";
      try {
        currentPasswd = fs.readFileSync(
          path.join(tempDir, "current_pool_passwd"),
          "utf8"
        );
      } catch (err) {
        console.warn(
          "Could not read existing pool_passwd, will create new one"
        );
      }

      // Add or update the user
      const lines = currentPasswd
        .split("\n")
        .filter((line) => !line.startsWith(`${userEmail}:`));
      lines.push(`${userEmail}:${md5Password}`);

      // Write updated file
      fs.writeFileSync(
        path.join(tempDir, "updated_pool_passwd"),
        lines.join("\n")
      );

      // Update the file in the volume
      await execAsync(
        `docker run --rm -v ${pgpoolVolumeName}:/etc/pgpool -v ${tempDir}:/tmp alpine sh -c "cp /tmp/updated_pool_passwd /etc/pgpool/pool_passwd && chmod 600 /etc/pgpool/pool_passwd"`
      );

      // Reload PgPool
      try {
        await execAsync(
          `docker exec ${pgpoolContainerName} sh -c "kill -SIGHUP 1"`
        );
        console.log("PgPool configuration reloaded");
      } catch (reloadErr) {
        console.warn(`PgPool reload warning: ${reloadErr}`);
      }

      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });

      // Return success
      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: {
          user_id: userID,
          database_id,
          access_level: "user",
          email: userEmail,
          created_at: new Date(),
        },
      });
      return;
    } catch (error) {
      console.error(
        `Failed to create role: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      res.status(500).json({
        success: false,
        message: "Failed to create role",
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
  } catch (error) {
    console.error(
      `Unexpected error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

const DeleteRole = async (req: Request, res: Response) => {
  try {
    const { database_id, userID } = req.body;
    const userinfoquery = "select role_password,email from users where id=$1";
    const uservalues = [userID];
    const userResult = await getDefaultReaderPool().query(
      userinfoquery,
      uservalues
    );
    const role_password = userResult.rows[0].role_password;
    const userEmail = userResult.rows[0].email;
    // Validate required inputs
    if (!database_id) {
      res.status(400).json({
        success: false,
        message:
          "Missing required parameters: database_id, userEmail, and role_password are required",
      });
      return;
    }

    // Get database information
    const databaseinfoquery = "SELECT * FROM databases WHERE id=$1";
    const values = [database_id];
    const databaseInforesult = await getDefaultReaderPool().query(
      databaseinfoquery,
      values
    );

    if (databaseInforesult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Database not found",
      });
      return;
    }

    const databaseinfo = databaseInforesult.rows[0];
    const {
      container_name: containerName,
      name: databaseName,
      password,
    } = databaseinfo;

    // Get PgPool information
    const pgpoolquery = "SELECT * FROM pgpool_instances WHERE id=$1";
    const pgpoolvalues = [databaseinfo.pgpool_id];
    const pgpoolinforesult = await getDefaultReaderPool().query(
      pgpoolquery,
      pgpoolvalues
    );

    if (pgpoolinforesult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "PgPool instance not found",
      });
    }

    const pgpoolinfo = pgpoolinforesult.rows[0];
    const {
      container_name: pgpoolContainerName,
      volume_name: pgpoolVolumeName,
    } = pgpoolinfo;

    console.log(`Deleting role for: ${userEmail}`);

    //ressaign owner to postgres
    const reassignOwnerCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} psql -U postgres -d ${databaseName} -c "REASSIGN OWNED BY \\\"${userEmail}\\\" TO postgres;"`;

    const { stdout: reassignOutput, stderr: reassignError } = await execAsync(
      reassignOwnerCmd
    );
    console.log(`Reassign output: ${reassignOutput}`);
    if (reassignError) console.log(`Reassign stderr: ${reassignError}`);

    // drop owned by user
    const dropOwnedCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} psql -U postgres -d ${databaseName} -c "DROP OWNED BY \\\"${userEmail}\\\";"`;
    const { stdout: dropOutput, stderr: dropError } = await execAsync(
      dropOwnedCmd
    );
    console.log(`Drop owned output: ${dropOutput}`);
    if (dropError) console.log(`Drop owned stderr: ${dropError}`);

    // drop role
    const dropRoleCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} psql -U postgres -c "DROP ROLE \\\"${userEmail}\\\";"`;
    const { stdout: dropRoleOutput, stderr: dropRoleError } = await execAsync(
      dropRoleCmd
    );
    console.log(`Drop role output: ${dropRoleOutput}`);
    if (dropRoleError) console.log(`Drop role stderr: ${dropRoleError}`);
    // Return success whether or not role was deleted
    res.status(200).json({
      success: true,
      message: "Role deleted successfully and objects reassigned to postgres",
      data: {
        user_id: userID,
        database_id,
        access_level: "user",
        email: userEmail,
        deleted_at: new Date(), // Changed from created_at to deleted_at
      },
    });
    return;
  } catch (error) {
    console.error(
      `Unexpected error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
const createReadonly = async (req: Request, res: Response) => {
  const { database_id, userID } = req.body;
  console.log("Creating readonly role for user:", userID);
  try {
    // Validate required inputs
    if (!database_id || !userID) {
      res.status(400).json({
        success: false,
        message:
          "Missing required parameters: database_id, userID, and access_level are required",
      });
      return;
    }

    // Get database information
    const databaseinfoquery = "SELECT * FROM databases WHERE id=$1";
    const values = [database_id];
    const databaseInforesult = await getDefaultReaderPool().query(
      databaseinfoquery,
      values
    );

    if (databaseInforesult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Database not found",
      });
      return;
    }

    const databaseinfo = databaseInforesult.rows[0];
    const {
      container_name: containerName,
      name: databaseName,
      password,
    } = databaseinfo;

    // Get PgPool information
    const pgpoolquery = "SELECT * FROM pgpool_instances WHERE id=$1";
    const pgpoolvalues = [databaseinfo.pgpool_id];
    const pgpoolinforesult = await getDefaultReaderPool().query(
      pgpoolquery,
      pgpoolvalues
    );

    if (pgpoolinforesult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "PgPool instance not found",
      });
    }

    const pgpoolinfo = pgpoolinforesult.rows[0];
    const {
      container_name: pgpoolContainerName,
      volume_name: pgpoolVolumeName,
    } = pgpoolinfo;

    const userinfoquery = "select role_password,email from users where id=$1";
    const uservalues = [userID];
    const userResult = await getDefaultReaderPool().query(
      userinfoquery,
      uservalues
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    const userEmail = userResult.rows[0].email;
    const role_password = userResult.rows[0].role_password;
    // create role
    console.log(`Creating readonly role for: ${userEmail}`);
    const createRoleCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} psql -U postgres -c "CREATE ROLE \\\"${userEmail}\\\" WITH LOGIN PASSWORD '${role_password}'; GRANT CONNECT ON DATABASE ${databaseName} TO \\\"${userEmail}\\\";"`;
    console.log("Creating role command:", createRoleCmd);
    const { stdout: createOutput, stderr: createError } = await execAsync(
      createRoleCmd
    );
    console.log(`Role creation output: ${createOutput}`);
    //give readonly access to the user
    const grantPrivilegesCmd = `docker exec -e PGPASSWORD="${password}" ${containerName} psql -U postgres -d ${databaseName} -c "GRANT CONNECT ON DATABASE ${databaseName} TO \\\"${userEmail}\\\"; GRANT USAGE ON SCHEMA public TO \\\"${userEmail}\\\"; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \\\"${userEmail}\\\"; GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO \\\"${userEmail}\\\"; GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO \\\"${userEmail}\\\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO \\\"${userEmail}\\\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO \\\"${userEmail}\\\"; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO \\\"${userEmail}\\\";"`;
    console.log("Granting privileges command:", grantPrivilegesCmd);
    const { stdout: roleOutput, stderr } = await execAsync(grantPrivilegesCmd);
    console.log(`Role privileges output: ${roleOutput}, stderr: ${stderr}`);

    res.status(201).json({
      success: true,
      message: "Readonly role created successfully",
      data: {
        user_id: userID,
        database_id,
        access_level: "readonly",
        email: userEmail,
        created_at: new Date(),
      },
    });
    return;
  } catch (error) {
    console.error(
      `Unexpected error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
export { CreateNewRole, DeleteRole, createReadonly };
