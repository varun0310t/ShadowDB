import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { parseFormData } from "@/lib/utils/ReqUtils";
import { getDefaultReaderPool, getDefaultWriterPool } from "@/lib/userPools";
import supabase from "@/lib/SupaBaseClient";
import { z } from "zod";

// Supabase client setup

// Schema for validating personal info updates
const personalInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  display_name: z.string().min(2).max(50).optional(),
  image: z
    .union([
      z.string().url(),
      z.string().regex(/^data:image\/(jpeg|png|gif);base64,/),
      z.literal(""),
    ])
    .optional(),
  imageFile: z.any().optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  github_username: z.string().max(39).optional(),
  twitter_username: z.string().max(15).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().length(2).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  email_notifications: z.boolean().optional(),
});

// GET: Fetch user's personal info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getDefaultReaderPool().query(
      `SELECT 
        name,
        display_name,
        email,
        image,
        provider,
        is_verified,
        bio,
        location,
        timezone,
        language,
        company,
        website,
        github_username,
        twitter_username,
        theme,
        email_notifications,
        last_login_at,
        created_at,
        updated_at
       FROM users
       WHERE id = $1 `,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    console.error("Error fetching personal info:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage || "Failed to fetch personal info" },
      { status: 500 }
    );
  }
}

// Update the PATCH handler to process file uploads
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the multipart form data
    const formData = await parseFormData(req);

    // Handle file upload if present
    let imageUrl = null;
    if (
      formData.imageFile &&
      formData.imageFile === "object" &&
      "arrayBuffer" in formData.imageFile
    ) {
      const file = formData.imageFile;

      // Check if user exists and get current data to handle old image
      const currentUser = await getDefaultReaderPool().query(
        `SELECT image FROM users WHERE id = $1`,
        [session.user.id]
      );

      // Delete old image if exists
      if (currentUser.rows[0]?.image) {
        const oldImagePath = currentUser.rows[0].image.split("/").pop();
        if (oldImagePath) {
          await supabase.storage.from("shadowdb-bucket").remove([oldImagePath]);
        }
      }

      // Upload new image
      const fileName = `${session.user.id}-${Date.now()}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        ""
      )}`;

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase
      const { error } = await supabase.storage
        .from("shadowdb-bucket")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error("Failed to upload image");
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("shadowdb-bucket").getPublicUrl(fileName);

      imageUrl = publicUrl;
    }
    // Check if user exists
    const currentUser = await getDefaultReaderPool().query(
      `SELECT provider FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [session.user.id]
    );

    if (currentUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user information with the new fields
    const result = await getDefaultWriterPool().query(
      `UPDATE users 
       SET 
        name = $1,
        display_name = $2,
        image = COALESCE($3, image),
        bio = $4,
        location = $5,
        company = $6,
        website = $7,
        github_username = $8,
        twitter_username = $9,
        timezone = $10,
        language = $11,
        theme = $12,
        email_notifications = $13,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $14
       WHERE id = $14 AND deleted_at IS NULL
       RETURNING 
        name, display_name, image, bio, location,
        company, website, github_username, twitter_username,
        timezone, language, theme, email_notifications,
        updated_at`,
      [
        formData.name,
        formData.display_name,
        imageUrl,
        formData.bio,
        formData.location,
        formData.company,
        formData.website,
        formData.github_username,
        formData.twitter_username,
        formData.timezone,
        formData.language,
        formData.theme,
        formData.email_notifications,
        session.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Personal information updated successfully",
      user: result.rows[0],
      imageUrl: imageUrl, // Return the image URL for the client
    });
  } catch (error: unknown) {
    console.error("Error updating personal info:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
