import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken } from '@/lib/staff-auth';

export async function GET(request: NextRequest) {
  // Cookie からトークンを取得
  const token = request.cookies.get('staff_token')?.value;
  
  if (!token) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
  
  try {
    // トークンを検証
    const payload = verifyStaffToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    
    // ペイロードから機密情報を除外
    const safePayload = await payload;
    console.log(safePayload);

    return NextResponse.json({ 
      authenticated: true,
      staff: safePayload
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}