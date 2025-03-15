// lib/errors.ts
import { z } from "zod";
import { ConvexError } from "convex/values";
// エラータイプの定義
export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  SERVER = "SERVER",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

// Zodエラーの型定義
interface ZodValidationError {
  zodErrors: z.ZodError['errors'];
}

// その他のエラー詳細の型定義
type ErrorDetails = ZodValidationError | Record<string, unknown>;

// アプリケーション固有のエラークラス
export class AppError extends Error {
  type: ErrorType;
  details?: ErrorDetails;
  
  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, details?: ErrorDetails) {
    super(message);
    this.type = type;
    this.details = details;
    this.name = 'AppError';
  }
}

// エラーハンドリングユーティリティ
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof z.ZodError) {
    return new AppError(
      '入力内容に問題があります',
      ErrorType.VALIDATION, 
      { zodErrors: error.errors }
    );
  }
  
  if (error instanceof Error) {
    // 特定のエラータイプの検出 (例: ClerkのErrorなど)
    if (error.message.includes('authentication')) {
      return new AppError(
        '認証に失敗しました。メールアドレスとパスワードを確認してください', 
        ErrorType.AUTHENTICATION
      );
    }
    
    return new AppError(error.message);
  }
  
  if (typeof error === 'string') {
    return new AppError(error);
  }
  
  return new AppError('予期しないエラーが発生しました');
}

// 型ガード関数
function isZodValidationError(details: ErrorDetails): details is ZodValidationError {
  return 'zodErrors' in details && Array.isArray((details as ZodValidationError).zodErrors);
}

// 人間が読みやすいエラーメッセージに変換
export function convertErrorMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.VALIDATION:
      if (error.details && isZodValidationError(error.details)) {
        const firstError = error.details.zodErrors[0];
        return `${firstError?.path.join('.')}: ${firstError?.message}`;
      }
      return error.message;
    
    case ErrorType.AUTHENTICATION:
      return 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
      
    case ErrorType.AUTHORIZATION:
      return 'この操作を行う権限がありません。';
      
    case ErrorType.NETWORK:
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
      
    case ErrorType.SERVER:
      return 'サーバーエラーが発生しました。しばらく経ってからもう一度お試しください。';
      
    default:
      return error.message || '予期しないエラーが発生しました。';
  }
}



export function handleErrorToMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    // error.dataからメッセージを取得
    const errorData = error.data as { message?: string };
    return errorData.message || "予期せぬエラーが発生しました";
  } else if (error instanceof Error) {
    // 一般的なエラー
    return error.message || "予期せぬエラーが発生しました";
  } else {
    // その他のエラー
    return "予期せぬエラーが発生しました";
  }
}
