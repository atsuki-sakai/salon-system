import { NextResponse } from 'next/server';
import Sentry from '@sentry/nextjs';
import { LineService } from '@/services/line/LineService';
import type { Message } from '@line/bot-sdk';
// リクエストボディの型定義
interface FlexMessageRequestBody {
  lineId: string;
  messages: Message[];
  accessToken: string;
}

// バリデーション結果の型定義
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * リクエストパラメータのバリデーション処理
 * @param body リクエストボディ
 * @returns バリデーション結果
 */
function validateRequestParams(body: unknown): ValidationResult {
  // オブジェクトかどうかを確認
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be an object' };
  }

  const typedBody = body as Record<string, unknown>;

  // 必須パラメータの存在チェック
  if (!typedBody.accessToken) {
    return { isValid: false, error: 'accessToken is required' };
  }
  if (!typedBody.lineId) {
    return { isValid: false, error: 'lineId is required' };
  }
  if (!typedBody.messages) {
    return { isValid: false, error: 'messages is required' };
  }

  // 型チェック
  if (typeof typedBody.accessToken !== 'string') {
    return { isValid: false, error: 'accessToken must be a string' };
  }
  if (typeof typedBody.lineId !== 'string') {
    return { isValid: false, error: 'lineId must be string' };
  }
  if (!Array.isArray(typedBody.messages)) {
    return { isValid: false, error: 'messages must be an array' };
  }

  return { isValid: true };
}

/**
 * LINE メッセージ送信API
 * @param request リクエストオブジェクト
 * @returns レスポンス
 */
export async function POST(request: Request) {
  try {
    // リクエストボディをパース
    const body = await request.json();

    // パラメータのバリデーション
    const validationResult = validateRequestParams(body);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    const { lineId, messages, accessToken } = body as FlexMessageRequestBody;

    // サービス層を使用してメッセージ送信
    const lineService = new LineService();
    const result = await lineService.sendFlexMessage(lineId, messages, accessToken);

    // 結果に基づいてレスポンスを返却
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message }, 
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    // エラーログの記録とSentryへの送信
    Sentry.captureException(error);
    console.error('Error in POST /api/line/message:', error);
    
    // エラーレスポンスの返却
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message }, 
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: '不明なエラー' }, 
        { status: 500 }
      );
    }
  }
}