import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
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
export async function GET(req: Request) {
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
  } catch (error: any) {
    console.error("Error fetching personal info:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal info" },
      { status: 500 }
    );
  }
}

// PATCH: Update user's personal info
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    try {
      personalInfoSchema.parse(body);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: `Invalid data: ${validationError.message}` },
        { status: 400 }
      );
    }

    let { image, ...otherFields } = body;

    // Handle base64 image upload
    if (image && image.startsWith("data:image")) {
      const currentUser = await getDefaultReaderPool().query(
        `SELECT image FROM users WHERE id = $1 `,
        [session.user.id]
      );

      // Delete old image if exists
      if (currentUser.rows[0]?.image) {
        const oldImagePath = currentUser.rows[0].image.split("/").pop();
        if (oldImagePath) {
          await supabase.storage
            .from("profile-pictures")
            .remove([oldImagePath]);
        }
      }

      // Upload new image
      const base64Data = image.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${session.user.id}-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        throw new Error("Failed to upload image");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);

      image = publicUrl;
    }

    // Check if user exists and get current data
    const currentUser = await getDefaultReaderPool().query(
      `SELECT provider FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [session.user.id]
    );

    if (currentUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For OAuth users, only allow updating certain fields
    if (currentUser.rows[0].provider !== "credentials" && image) {
      return NextResponse.json(
        { error: "OAuth users cannot change their profile image" },
        { status: 400 }
      );
    }

    // Update user information
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
        otherFields.name,
        otherFields.display_name,
        image,
        otherFields.bio,
        otherFields.location,
        otherFields.company,
        otherFields.website,
        otherFields.github_username,
        otherFields.twitter_username,
        otherFields.timezone,
        otherFields.language,
        otherFields.theme,
        otherFields.email_notifications,
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
    });
  } catch (error: any) {
    console.error("Error updating personal info:", error);
    return NextResponse.json(
      { error: "Failed to update personal information" },
      { status: 500 }
    );
  }
}
