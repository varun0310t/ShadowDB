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
          if (!user.password || !(await bcrypt.compare(password, user.password))) {
            console.log("Invalid password");
            return null;
          }

          console.log("Authorized user:", user);
          return { 
            id: user.id, 
            name: user.name || "", 
            email: user.email,
            provider: 'credentials'
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
          // Check if user exists
          const result = await getDefaultReaderPool().query(
            "SELECT * FROM users WHERE email = $1 AND provider = $2",
            [user.email, account.provider]
          );

          if (result.rows.length === 0) {
            // Create new user with provider information
            await getDefaultWriterPool().query(
              `INSERT INTO users (
                name, 
                email, 
                is_verified, 
                provider, 
                provider_id,
                image
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                user.name,
                user.email,
                true,
                account.provider,
                account.providerAccountId,
                user.image || null,
              ]
            );
          }
          return true;
        } catch (error) {
          console.error("Error handling OAuth sign in:", error);
          return false;
        }
      }
      return true;
    },
    jwt: async ({ token, user, account }) => {
      if (user) {
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
