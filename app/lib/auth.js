import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { verifyUser, createGoogleUser, getUserPlan, getUserCreditsBalance } from "./userStore";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await verifyUser(credentials.email, credentials.password);
        return user;
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        await createGoogleUser(profile.name || profile.email.split("@")[0], profile.email, profile.picture);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.provider = account?.provider || "credentials";
      }
      if (token.email) {
        const plan = await getUserPlan(token.id || token.email);
        const credits = await getUserCreditsBalance(token.id || token.email);
        token.plan = plan.plan_name || 'Free';
        token.plan_id = plan.plan_id || 'free';
        token.credits = credits;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.provider = token.provider;
        session.user.plan = token.plan || 'Free';
        session.user.plan_id = token.plan_id || 'free';
        session.user.credits = token.credits || 0;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
