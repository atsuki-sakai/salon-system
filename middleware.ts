import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyStaffToken } from "@/lib/staff-auth";
import { clerkMiddleware } from "@clerk/nextjs/server";

// スタッフ関連のパス
const staffPaths = ["/staff-auth", "/staff-portal"];

// スタッフポータル関連のパス
const staffPortalPaths = ["/staff-portal"];

// 管理者ロールが必要なパス
const adminPaths = ["/staff-portal/admin"];

// マネージャーロールが必要なパス
const managerPaths = ["/staff-portal/manager"];

// 認証不要なパス
const publicPaths = ["/", "/sign-in", "/sign-up", "/api", "/reservation", "/staff-auth"];

const isStaffPath = (pathname: string): boolean =>
  staffPaths.some(
    (staffPath) =>
      pathname === staffPath || pathname.startsWith(`${staffPath}/`)
  );

const isStaffPortalPath = (pathname: string): boolean =>
  staffPortalPaths.some(
    (portalPath) =>
      pathname === portalPath || pathname.startsWith(`${portalPath}/`)
  );

const isAdminPath = (pathname: string): boolean =>
  adminPaths.some(
    (adminPath) =>
      pathname === adminPath || pathname.startsWith(`${adminPath}/`)
  );

const isManagerPath = (pathname: string): boolean =>
  managerPaths.some(
    (managerPath) =>
      pathname === managerPath || pathname.startsWith(`${managerPath}/`)
  );

const isPublicPath = (pathname: string): boolean =>
  publicPaths.some(
    (publicPath) =>
      pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );

// スタッフ認証ミドルウェア
async function handleStaffAuth(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // スタッフ認証トークンを取得
  const staffToken = req.cookies.get("staff_token")?.value;
  
  if (!staffToken) {
    // ダッシュボードへのアクセスで認証がない場合
    if (pathname.startsWith('/dashboard/')) {
      // Clerkの認証がないと仮定し、そのまま処理を続行（Clerkミドルウェアで処理される）
      return NextResponse.next();
    }
    
    // スタッフポータルへのアクセスで認証がない場合
    if (isStaffPortalPath(pathname)) {
      const loginUrl = new URL(`/staff-auth/error`, req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // 認証がないその他のスタッフパスは通常通り処理
    return NextResponse.next();
  }
  
  try {
    const payload = await verifyStaffToken(staffToken);
    
    if (!payload) {
      // 無効なトークンの場合はスタッフログインへリダイレクト
      const loginUrl = new URL("/staff-auth", req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // スタッフポータルへのアクセスの場合は権限チェック
    if (isStaffPortalPath(pathname)) {
      // 管理者ロールが必要なパスの権限チェック
      if (isAdminPath(pathname) && payload.role !== "admin") {
        // 権限がない場合はスタッフポータルトップへリダイレクト
        const portalUrl = new URL("/staff-portal", req.url);
        return NextResponse.redirect(portalUrl);
      }
      
      // マネージャーロールが必要なパスの権限チェック
      if (isManagerPath(pathname) && (payload.role !== "admin" && payload.role !== "manager")) {
        // 権限がない場合はスタッフポータルトップへリダイレクト
        const portalUrl = new URL("/staff-portal", req.url);
        return NextResponse.redirect(portalUrl);
      }
      
      // スタッフでログイン中なら共通ダッシュボードにリダイレクト
      if (pathname === "/staff-portal") {
        const dashboardUrl = new URL(`/dashboard/${payload.salonId}`, req.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
    
    // スタッフがログイン済みでスタッフ認証ページにアクセスした場合
    if (pathname.startsWith('/staff-auth/')) {
      // ダッシュボードへリダイレクト
      const dashboardUrl = new URL(`/dashboard/${payload.salonId}`, req.url);
      return NextResponse.redirect(dashboardUrl);
    }
    
    return NextResponse.next();
  } catch (err) {
    // エラーが発生した場合はスタッフログインへリダイレクト
    console.error('Staff token verification error:', err);
    const loginUrl = new URL("/staff-auth", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

// 注意: 下記の handleStaffAuth 関数はリファクタリングの過程で一部の機能が置き換えられました
// 将来的には完全に新しい実装に統合するといいでしょう

// Clerkミドルウェアの設定
export default clerkMiddleware(
  async (auth, req) => {
    const { userId } = await auth();
    const { pathname } = req.nextUrl;
    
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
      } catch (err) {
        console.error('Staff token verification error:', err);
      }
    }
    
    // 認証ページ（sign-in, sign-up）またはスタッフログインページでログイン済みの場合はダッシュボードへリダイレクト
    if (isAuthPath || pathname.startsWith('/staff-auth/')) {
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

    // スタッフポータルパスの場合のみスタッフ認証を処理
    // staff-authは上のロジックでカバー済み
    if (isStaffPortalPath(pathname)) {
      return handleStaffAuth(req);
    }

    // 通常のブラウザでの処理
    if (isPublicPath(pathname)) {
      if (userId) {
        const dashboardUrl = new URL(`/dashboard/${userId}`, req.url);
        return NextResponse.redirect(dashboardUrl);
      }
      return NextResponse.next();
    }

    // この部分は上の checkStaffAuthForDashboard に統合しました
    
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

// matcher に公開パスとスタッフポータルパスを追加
export const config = {
  matcher: ["/", "/dashboard/:path*", "/sign-in", "/sign-up", "/staff-auth/:path*", "/staff-portal/:path*", "/reservation/:path*"],
};
