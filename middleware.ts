import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 認証不要なパス
const publicPaths = ["/sign-in", "/sign-up", "/api", "/reserve"];

const isPublicPath = (pathname: string): boolean =>
  publicPaths.some(
    (publicPath) =>
      pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );

export default clerkMiddleware(
  async (auth, req) => {
    const { userId } = await auth();
    const { pathname } = req.nextUrl;

    // 公開パスの場合
    if (isPublicPath(pathname)) {
      if (userId) {
        const dashboardUrl = new URL(`/dashboard/${userId}`, req.url);
        return NextResponse.redirect(dashboardUrl);
      }
      return NextResponse.next();
    }

    // 公開パス以外の場合、未認証ならサインインページへリダイレクト
    if (!userId) {
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

// matcher に公開パスも追加して、ミドルウェアを適用する
export const config = {
  matcher: ["/", "/dashboard/:path*", "/sign-in", "/sign-up"],
};
