import { Request, Response } from "express";
import { renameDatabase, RenameReferences } from "../lib/DBUtility/DBUtils";
const UpdateConfiguration = async (req: Request, res: Response) => {
  const { tenancy_type, Original_DB_Name, New_DB_Name, UserID, database_id } =
    req.body;
  // Validate tenancy_type
  if (!["shared", "isolated"].includes(tenancy_type)) {
    res.status(400).json({ error: "Invalid tenancy type" });
    return;
  }

  if (!Original_DB_Name) {
    res.status(400).json({ error: "Original Db name is required" });
    return;
  }

  try {
    let RenameResult = { success: false, message: "" };
    console.log("here");
    if (New_DB_Name && New_DB_Name !== "" && Original_DB_Name !== New_DB_Name) {
      console.log(database_id);
      RenameResult = await renameDatabase(
        database_id,
        tenancy_type,
        Original_DB_Name,
        New_DB_Name,
        UserID
      );
      console.log("here2");
      if (RenameResult.success) {
        // Update references in related tables
        const updateResult = await RenameReferences(
          database_id,
          Original_DB_Name,
          New_DB_Name,
          UserID
        );
        RenameResult.message += ` (${updateResult.message})`;
      } else {
        res.status(500).json({ RenameResult: RenameResult });
        return;
      }
    }
    console.log("here3", RenameResult);
    res.status(200).json({ RenameResult: RenameResult });
    return;
  } catch (error: any) {
    console.error("Pool configuration error:", error);
    res.status(500).json({ error: error.message });
    return;
  }
};

export { UpdateConfiguration };
