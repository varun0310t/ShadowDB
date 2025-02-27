import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import {
  getDefaultReaderPool,
  getDefaultWriterPool,
} from "../../../../lib/userPools";
import bcrypt from "bcrypt";
import "@/db/index";
import { use } from "react";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "john@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials ?? {};
        if (!email || !password) {
          return null;
        }

        try {
          // Query the database for a user with the provided email AND credentials provider
          const res = await getDefaultReaderPool().query(
            "SELECT * FROM users WHERE email = $1 AND provider = 'credentials'",
            [email]
          );

          if (res.rows.length === 0) {
            console.log("User not found or not a credentials user");
            return null;
          }

          const user = res.rows[0];

          if (!user.is_verified) {
            console.log("User not verified");
            return null;
          }

          // Check if password exists and matches
          if (
            !user.password ||
            !(await bcrypt.compare(password, user.password))
          ) {
            console.log("Invalid password");
            return null;
          }

          console.log("Authorized user:", user);
          return {
            id: user.id,
            name: user.name || "",
            email: user.email,
            provider: "credentials",
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          console.log("Sign in attempt:", {
            email: user.email,
            provider: account.provider,
          });

          // First query - check exact match (changed the query)
          const result = await getDefaultReaderPool().query(
            "SELECT * FROM users WHERE email = $1 AND provider = $2::provider_type",
            [user.email, account.provider]
          );

          console.log("Exact match query result:", result.rows);

          if (result.rows.length > 0) {
            return true;
          }

          // Second query - check email with any provider (changed the query)
          const emailExists = await getDefaultReaderPool().query(
            "SELECT provider FROM users WHERE email = $1 LIMIT 1",
            [user.email]
          );

          console.log("Email exists query result:", emailExists.rows);

          if (emailExists.rows.length > 0) {
            // Cast the provider to string for error message
            const providerName = emailExists.rows[0].provider.toString();
            throw new Error(
              `This email is already registered with ${providerName}. Please use that to sign in.`
            );
          }

          // Create new user (added RETURNING clause)
          const newUser = await getDefaultWriterPool().query(
            `INSERT INTO users (
              
              name, 
              email, 
              is_verified, 
              provider, 
              provider_id,
              image,
              role
            ) VALUES ($1, $2, $3, $4::provider_type, $5, $6, $7::role)
            RETURNING *`,
            [
              user.name || profile?.name || "", // Using profile.login for GitHub
              user.email,
              true,
              account.provider,
              account.providerAccountId,
              user.image || null,
              "user",
            ]
          );

          console.log("New user created:", newUser.rows[0]);

          // Overwrite the user object with database values
          user.id = newUser.rows[0].id; // Set the proper database ID
          return true;
        } catch (error) {
          console.error("Error handling OAuth sign in:", error);
          // Check if it's a duplicate key error
          if (
            error instanceof Error &&
            error.message.includes("unique_email_per_provider")
          ) {
            throw new Error(
              "This account already exists. Please try logging in."
            );
          }
          throw error;
        }
      }
      return true;
    },
    jwt: async ({ token, user, account }) => {
      // For OAuth providers, look up the database ID after creating the user
      if (
        user &&
        (account?.provider === "google" || account?.provider === "github")
      ) {
        try {
          // Look up the user by email and provider to get the database ID
          const userResult = await getDefaultReaderPool().query(
            "SELECT id FROM users WHERE email = $1 AND provider = $2::provider_type",
            [user.email, account.provider]
          );

          if (userResult.rowCount && userResult.rowCount > 0) {
            // Use the database ID instead of the provider ID
            token.user = {
              id: userResult.rows[0].id, // Database ID
              name: user.name,
              email: user.email,
              image: user.image,
            };
          } else {
            // Fallback to provider ID if necessary
            token.user = {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            };
          }
        } catch (error) {
          console.error("Error fetching user database ID:", error);
          // Fallback to provider ID if lookup fails
          token.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        }
      } else if (user) {
        // For credential logins, use the database ID directly
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }

      if (account) {
        token.provider = account.provider;
        token.providerId = account.providerAccountId;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token.user) {
        session.user = token.user;
      }
      session.provider = token.provider as string;
      return session;
    },
  },
  debug: true, // Add this to see detailed error messages
  pages: {
    signIn: "/Users/login",
    error: "/Users/error",
  },
};
