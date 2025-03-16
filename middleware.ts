import { NextResponse } from "next/server";
import { verifyStaffToken } from "@/lib/staff-auth";
import { clerkMiddleware } from "@clerk/nextjs/server";


// 認証不要なパス
const publicPaths = ["/", "/sign-in", "/sign-up", "/api", "/reservation/:path*", "/staff/login"];


const isPublicPath = (pathname: string): boolean => 
  publicPaths.some(
    (publicPath) => 
      pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );

// 注意: 下記の handleStaffAuth 関数はリファクタリングの過程で一部の機能が置き換えられました
// 将来的には完全に新しい実装に統合するといいでしょう

// Clerkミドルウェアの設定
export default clerkMiddleware(
  async (auth, req) => {
    const { userId } = await auth();
    const { pathname } = req.nextUrl;
    
    console.log(`[Middleware] Processing request: ${pathname}, userId: ${userId ? 'logged-in' : 'not-logged-in'}`);
    
    // サインイン/サインアップページへの特別処理
    // ログイン済みの場合はダッシュボードへリダイレクト
    const authPaths = ['/sign-in', '/sign-up', '/sign-out'];
    const isAuthPath = authPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
    
    // スタッフトークンを確認
    const staffToken = req.cookies.get("staff_token")?.value;
    let staffPayload = null;
    
    if (staffToken) {
      try {
        staffPayload = await verifyStaffToken(staffToken);
        console.log(`[Middleware] Staff token verified for salonId: ${staffPayload?.salonId}`);
      } catch (err) {
        console.error('Staff token verification error:', err);
      }
    }
    
    // 認証ページ（sign-in, sign-up）またはスタッフログインページでログイン済みの場合はダッシュボードへリダイレクト
    if (isAuthPath || pathname.startsWith('/staff/login')) {
      // オーナーとしてログイン済み
      if (userId) {
        const dashboardUrl = new URL(`/dashboard/${userId}`, req.url);
        return NextResponse.redirect(dashboardUrl);
      }
      
      // スタッフとしてログイン済み
      if (staffPayload) {
        const dashboardUrl = new URL(`/dashboard/${staffPayload.salonId}`, req.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }

    // LIFFブラウザからのアクセスかどうかを確認
    const userAgent = req.headers.get("user-agent") || "";
    const isLiffBrowser = userAgent.includes("LIFF");

    // LIFF環境では認証をスキップ
    if (isLiffBrowser) {
      console.log('[Middleware] LIFF browser detected, skipping auth');
      return NextResponse.next();
    }

    // スタッフ認証トークンは上で既に取得済み
    // ダッシュボードへのアクセスの場合のチェック
    if (staffPayload) {
      // ダッシュボードへのアクセスで、適切なサロンIDであれば許可
      if (pathname.startsWith('/dashboard/')) {
        const pathParts = pathname.split('/');
        const pathSalonId = pathParts[2]; // /dashboard/:salonId の部分
        
        if (pathSalonId && pathSalonId === staffPayload.salonId) {
          return NextResponse.next();
        } else {
          // サロンIDが一致しない場合は、正しいサロンIDでリダイレクト
          const correctDashboard = new URL(`/dashboard/${staffPayload.salonId}`, req.url);
          return NextResponse.redirect(correctDashboard);
        }
      }
    }

    // 通常のブラウザでの処理
    if (isPublicPath(pathname)) {
      console.log(`[Middleware] Public path detected: ${pathname}`);
      console.log(`[Middleware] isPublicPath check result: ${isPublicPath(pathname)}`);
      
      // 予約ページは認証の有無にかかわらずアクセス可能にする
      if (pathname.startsWith('/reservation/')) {
        console.log('[Middleware] Reservation path detected, allowing access without redirect');
        return NextResponse.next();
      }
      
      // それ以外の公開パス（トップページなど）は認証済みならダッシュボードへリダイレクト
      if (userId) {
        console.log(`[Middleware] User is authenticated, redirecting to dashboard: /dashboard/${userId}`);
        const dashboardUrl = new URL(`/dashboard/${userId}`, req.url);
        return NextResponse.redirect(dashboardUrl);
      }
      console.log('[Middleware] Allowing public path access');
      return NextResponse.next();
    }

    // この部分は上の checkStaffAuthForDashboard に統合しました
    
    // 公開パス以外の場合、未認証ならサインインページへリダイレクト
    if (!userId) {
      console.log('[Middleware] User not authenticated, redirecting to sign-in');
      const signInUrl = new URL("/sign-in", req.url);
      return NextResponse.redirect(signInUrl);
    }

    console.log('[Middleware] Proceeding to next middleware/handler');
    return NextResponse.next();
  },
  () => ({
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  })
);

// matcher に公開パスとスタッフポータルパスを追加
export const config = {
  matcher: ["/", "/dashboard/:path*", "/sign-in", "/sign-up", "/staff/login", "/reservation/:path*"],
};
