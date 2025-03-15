import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { generateStaffToken } from '@/lib/staff-auth';

// Convex HTTP クライアントの初期化
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    console.log("=== STAFF LOGIN API START ===");
    
    // リクエストボディを取得
    const body = await request.json();
    console.log("Request body received:", JSON.stringify(body));
    
    const { email, pin, salonId, staffId } = body;
    
    // staffIdだけを使うケースの処理
    if (staffId && pin) {
      console.log("StaffId + pin login attempt:", { staffId, pin });

      // ケース2: staffIdが直接指定されている場合、PINコード検証のみを行う
      try {
        const staffData = await convex.action(api.staff_auth.verifyPin, {
          staffId,
          pin
        });
        
        if (!staffData) {
          console.error("PIN verification failed: No staff data returned");
          return NextResponse.json(
            { error: 'PINコードの検証に失敗しました' },
            { status: 401 }
          );
        }
        
        console.log("PIN verification successful:", staffData);
        
        // 認証成功：JWTトークンを生成
        const token = await generateStaffToken({
          staffId: staffData.staffId,
          salonId: staffData.salonId,
          role: staffData.role || 'staff',
          name: staffData.name
        });
        
        console.log("Token generated, length:", token.length);
        
        // レスポンスオブジェクトの生成とCookieの設定
        const response = NextResponse.json({ 
          success: true,
          token: token,
          staffData: {
            staffId: staffData.staffId,
            name: staffData.name,
            role: staffData.role || 'staff',
            salonId: staffData.salonId
          }
        });
        
        // Cookieを設定
        response.cookies.set({
          name: 'staff_token',
          value: token,
          httpOnly: false, // これをtrueにするとフロントエンドでは動作しない
          maxAge: 60 * 60 * 8, // 8時間
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        });
        
        console.log("Response prepared with token");
        console.log("=== STAFF LOGIN API END (SUCCESS) ===");
        return response;
      } catch (pinError) {
        console.error("Error in PIN verification:", pinError);
        return NextResponse.json(
          { error: pinError instanceof Error ? pinError.message : 'PINコードの検証に失敗しました' },
          { status: 401 }
        );
      }
    }

    // 通常のフロー: email と salonId が必要
    if (!email || !salonId) {
      console.error("Missing required fields:", { email, salonId });
      return NextResponse.json(
        { error: '必須項目が不足しています (email, salonId)' }, 
        { status: 400 }
      );
    }

    // ステップ1: メールアドレスの検証
    let staffVerification;
    try {
      console.log("Verifying email:", email, "for salon:", salonId);
      staffVerification = await convex.mutation(api.staff_auth.verifyEmail, {
        email,
        salonId
      });
      console.log("Email verification successful:", staffVerification);
    } catch (error: unknown) {
      console.error('Email verification failed:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'メールアドレスの検証に失敗しました' },
        { status: 401 }
      );
    }

    // メールアドレス検証のみの場合は、PINコード検証をスキップ
    if (!pin || pin === "0000") {
      console.log("Skipping PIN verification");
      return NextResponse.json({ 
        success: true,
        staffData: {
          staffId: staffVerification.staffId,
          name: staffVerification.name,
        }
      });
    }

    // staffIdがある場合はそれを使う、なければメール検証の結果を使う
    const targetStaffId = staffId || staffVerification.staffId;
    console.log("Using staffId for PIN verification:", targetStaffId);

    // ステップ2: PINコードの検証
    let staffData;
    try {
      console.log("Verifying PIN for staffId:", targetStaffId);
      staffData = await convex.action(api.staff_auth.verifyPin, {
        staffId: targetStaffId,
        pin
      });
      console.log("PIN verification successful:", staffData);
    } catch (error: unknown) {
      console.error('PIN verification failed:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'PINコードの検証に失敗しました' },
        { status: 401 }
      );
    }

    // 認証成功：JWTトークンを生成 (非同期)
    console.log("Generating token for staff:", staffData);
    const token = await generateStaffToken({
      staffId: staffData.staffId,
      salonId: staffData.salonId,
      role: staffData.role || 'staff',
      name: staffData.name
    });
    console.log("Token generated, length:", token.length);

    // レスポンスオブジェクトの生成とCookieの設定
    const response = NextResponse.json({ 
      success: true,
      // トークンをレスポンスボディにも含める
      token: token,
      staffData: {
        staffId: staffData.staffId,
        name: staffData.name,
        role: staffData.role || 'staff',
        salonId: staffData.salonId
      }
    });

    // セキュアなCookieとしてトークンを設定
    // 本番環境ではsecure: trueを設定する
    response.cookies.set({
      name: 'staff_token',
      value: token,
      httpOnly: true, // セキュリティのためhttpOnlyを維持
      maxAge: 60 * 60 * 8, // 8時間
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    console.log("Response prepared with token");
    console.log("=== STAFF LOGIN API END (SUCCESS) ===");
    return response;
  } catch (error) {
    console.error('Login error:', error);
    console.log("=== STAFF LOGIN API END (ERROR) ===");
    return NextResponse.json(
      { error: 'ログイン処理に失敗しました' },
      { status: 500 }
    );
  }
}

// トークン検証用のエンドポイント
export async function GET(request: NextRequest) {
  console.log("=== TOKEN VERIFICATION API START ===");
  // Cookie からトークンを取得
  const token = request.cookies.get('staff_token')?.value;
  
  console.log("Token from cookie:", token ? `exists (length: ${token.length})` : "not found");
  
  if (!token) {
    console.log("=== TOKEN VERIFICATION API END (UNAUTHORIZED) ===");
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
  
  try {
    // トークンの検証は middleware.ts で行われるため、
    // ここまで到達した場合は認証されていると判断
    console.log("=== TOKEN VERIFICATION API END (SUCCESS) ===");
    return NextResponse.json({ 
      authenticated: true
    });
  } catch (error) {
    console.error('Token verification error:', error);
    console.log("=== TOKEN VERIFICATION API END (ERROR) ===");
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}