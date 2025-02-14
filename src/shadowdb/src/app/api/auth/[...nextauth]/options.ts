import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";
import pool from "../../../../../db";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email", placeholder: "john@example.com" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          // Ensure credentials are provided
          const { email, password } = credentials ?? {};
          if (!email || !password) {
            return null;
          }

          try {
            // Query the database for a user with the provided email
            const res = await pool.query(
              "SELECT * FROM users WHERE email = $1",
              [email]
            );
  
            if (res.rows.length === 0) {
              return null;
            }
  
            const user = res.rows[0];

            if(!user.verified){
              return null;
            }

            if (!(await bcrypt.compare(password,user.password))) {
              return null;
            }

             // console.log("Authorized user:", user);
            // Return an object with the user info (excluding sensitive info)
            return { id: user.id, name: user.name || "", email: user.email };
          } catch (error) {
            console.error("Authorize error:", error);
            return null;
          }
        },
      }),
    ],

  };