import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(
  async (auth, req) => {
    const { userId } = await auth();
    const { pathname } = req.nextUrl;
    // サインイン・サインアップページは認証チェック対象外とする
    if (!userId && !pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up")) {
      const signInUrl = new URL("/sign-in", req.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  },
  () => ({
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  })
);

export const config = {
  matcher: [
    // Next.js の内部処理や静的ファイルを除外
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API ルートも含む
    '/(api|trpc)(.*)',
    '/dashboard/:path*',
  ],
};
