import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { saveUser, getUserByEmail } from "@/lib/data";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
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
  // Explicitly set the URL - this ensures proper callback URLs
  ...(process.env.NEXTAUTH_URL && { 
    url: process.env.NEXTAUTH_URL 
  }),
  // Cookie configuration for production with reverse proxy
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // Secure only in production (HTTPS)
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Explicitly set secure cookies based on URL protocol
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://"),
};
