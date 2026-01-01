import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { saveUser, getUserByEmail } from "@/lib/data";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      // Get or create user in our data store
      let existingUser = await getUserByEmail(user.email);
      
      if (!existingUser) {
        // Create new user
        const newUser = {
          id: user.id,
          email: user.email,
          name: user.name || '',
          image: user.image || undefined,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        await saveUser(newUser);
      } else {
        // Update last login
        existingUser.lastLogin = new Date().toISOString();
        if (user.name) existingUser.name = user.name;
        if (user.image) existingUser.image = user.image;
        await saveUser(existingUser);
      }
      
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
