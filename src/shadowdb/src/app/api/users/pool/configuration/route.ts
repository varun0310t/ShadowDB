import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import axios from "axios";
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
  const { tenancy_type, Original_DB_Name, New_DB_Name, database_id } =
    await req.json();

  // Validate tenancy_type
  if (!["shared", "isolated"].includes(tenancy_type)) {
    return NextResponse.json(
      { error: "Invalid tenancy type" },
      { status: 400 }
    );
  }

  // Validate db_name for isolated tenancy
  if (!Original_DB_Name) {
    return NextResponse.json(
      { error: " Original db_name is required" },
      { status: 400 }
    );
  }

  try {
    let RenameResultRes = { message: "" };

    if (New_DB_Name && New_DB_Name !== "" && Original_DB_Name !== New_DB_Name) {
      let RenameResult = await axios.post(
        `${process.env.DB_Service_url}/api/configuration/update`,
        {
          database_id,
          tenancy_type,
          Original_DB_Name,
          New_DB_Name,
          UserID: session.user.id,
        }
      );
      // console.log(RenameResult);
      if (RenameResult.data.RenameResult.success === true) {
        // Update references in related tables
        return NextResponse.json(
          { RenameResult: RenameResult.data.RenameResult },
          { status: 200 }
        );
      } else {
        return NextResponse.json({ RenameResult: "failed" }, { status: 500 });
      }
    }
    console.log("here");
    return NextResponse.json({ RenameResult: "succes" }, { status: 200 });
  } catch (error: any) {
    console.error("Pool configuration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
