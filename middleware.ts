import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 認証不要なパス（APIルートは matcher で除外するので、ここではサインイン・サインアップのみ）
const publicPaths = ["/sign-in", "/sign-up"];

export default clerkMiddleware(
  async (auth, req) => {
    const { userId } = await auth();
    const { pathname } = req.nextUrl;

    // APIルートは認証処理をスキップ
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // 公開パスの場合
    if (
      publicPaths.some(
        (publicPath) =>
          pathname === publicPath || pathname.startsWith(`${publicPath}/`)
      )
    ) {
      // ユーザーが認証済みの場合、ダッシュボードにリダイレクト（既存の挙動）
      if (userId) {
        const dashboardUrl = new URL(`/dashboard/${userId}`, req.url);
        return NextResponse.redirect(dashboardUrl);
      }
      return NextResponse.next();
    }

    // その他のパスの場合、未認証ならサインインページへリダイレクト
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

// matcher 設定で "/api/" 以外の全ルートにミドルウェアを適用する
export const config = {
  matcher: ["/((?!api/).*)"],
};
