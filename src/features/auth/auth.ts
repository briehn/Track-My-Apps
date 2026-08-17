import NextAuth from "next-auth";

import { authOptions } from "@/features/auth/auth-options";

export const { auth, handlers } = NextAuth(authOptions);
