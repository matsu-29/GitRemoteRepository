import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

async function refreshAccessToken(token) {
  try {
    const url = "https://accounts.spotify.com/api/token";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: "https://accounts.spotify.com/authorize?scope=user-read-email,user-read-private,user-read-playback-state,user-modify-playback-state",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // 初回ログイン時にアクセストークン等を保存
      
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at * 1000,
          refreshToken: account.refresh_token,
          user,
        };
      }

      // 有効期限内ならそのまま返す
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // トークン期限切れの場合はリフレッシュ処理
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
