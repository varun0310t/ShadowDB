import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import "../../../../../db/index";
import {
  getDefaultReaderPool,
  getDefaultWriterPool,
} from "../../../../../lib/userPools";
import {
  terminateDbConnections,
  renameDatabase,
  RenameReferences,
  databaseExists,
} from "../../../../../lib/utils/DButils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Parse incoming JSON request body
  const { tenancy_type, Original_DB_Name, New_DB_Name } = await req.json();

  // Validate tenancy_type
  if (!["shared", "isolated"].includes(tenancy_type)) {
    return NextResponse.json(
      { error: "Invalid tenancy type" },
      { status: 400 }
    );
  }

  // Validate db_name for isolated tenancy
  if (tenancy_type === "isolated" && !Original_DB_Name) {
    return NextResponse.json(
      { error: "db_name is required for isolated tenancy" },
      { status: 400 }
    );
  }

  try {
    let RenameResult = { success: false, message: "" };

    if (New_DB_Name && New_DB_Name !== "" && Original_DB_Name !== New_DB_Name) {
      RenameResult = await renameDatabase(
        Original_DB_Name,
        New_DB_Name,
        session.user.id
      );

      if (RenameResult.success) {
        // Update references in related tables
        const updateResult = await RenameReferences(
          Original_DB_Name,
          New_DB_Name,
          session.user.id
        );
        RenameResult.message += ` (${updateResult.message})`;
      } else {
        return NextResponse.json(
          { RenameResult: RenameResult },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ RenameResult: RenameResult }, { status: 200 });
  } catch (error: any) {
    console.error("Pool configuration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
