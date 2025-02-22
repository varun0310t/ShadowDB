import NextAuth,{DefaultSession,DefaultUser} from "next-auth";
import {JWT} from "next-auth/jwt";
import { decl } from "postcss";
declare module "next-auth" {
  interface Session {
    provider?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }&DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: DefaultUser;
    provider?: string;
  }
}