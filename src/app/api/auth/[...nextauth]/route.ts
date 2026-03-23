import { NextAuthOptions } from "next-auth";
import { GitHubProvider } from "next-auth/providers/github";
import { GoogleProvider } from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.NEXTAUTH_GITHUB_ID || "",
      clientSecret: process.env.NEXTAUTH_GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.NEXTAUTH_GOOGLE_ID || "",
      clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET || "",
    }),
  ],
  callbacks: {
    signIn: {account} => true,
    jwt: {token} => true,
  },
  custom: {},
};
