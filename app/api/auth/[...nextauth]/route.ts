import NextAuth, { AuthOptions, SessionStrategy } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

// Explicitly typing this as AuthOptions fixes the 'string' vs 'SessionStrategy' error
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB()
        if (!credentials?.email || !credentials?.password) return null

        // Fetch user document
        const userDoc = await User.findOne({ email: credentials.email })
        if (!userDoc || !userDoc.password) return null

        const isValid = await userDoc.comparePassword(credentials.password)
        if (!isValid) return null

        return {
          id: userDoc._id.toString(),
          email: userDoc.email,
          name: userDoc.name,
          role: userDoc.role,
        }
      },
    }),
  ],

  session: {
    // TypeScript now knows this is specifically a SessionStrategy, not just any string
    strategy: "jwt" as SessionStrategy,
  },

  pages: {
    signIn: "/auth/login",
  },

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
      }
      return token
    },

    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.role = token.role
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }