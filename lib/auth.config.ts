import type { NextAuthConfig } from "next-auth"

// Edge-compatible config: no imports from prisma, bcryptjs, or Node-only packages.
// Used by middleware for JWT verification.
export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.user.role = token.role as any
      return session
    },
  },
  providers: [],
  session: { strategy: "jwt" as const, maxAge: 8 * 60 * 60 },
} satisfies NextAuthConfig
