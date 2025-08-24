import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            debug: true,
            authorization: {
                params: {
                    prompt: "select_account",  // 🔑 always ask account
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account?.provider === "google") {
                console.log("✅ Google login success. Google access token received:", account.access_token)
                token.accessToken = account.access_token
            } else {
                console.log("ℹ️ No Google account, skipping...")
            }
            console.log("📦 JWT callback token object:", token)
            return token
        },
        async session({ session, token }) {
            console.log("💡 Before attaching Google token to session:", session)
            session.accessToken = token.accessToken
            console.log("✅ Session with Google token:", session)
            return session
        },
    },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
