'use client';

import { useStaffAuth } from '@/hooks/useStaffAuth';
import { ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';

interface RoleBasedViewProps {
  children: ReactNode;
  requiredRole: 'admin' | 'manager' | 'staff';
  fallback?: ReactNode;
}

/**
 * 権限に基づいてUIを条件付きレンダリングするコンポーネント
 * オーナー（Clerk認証）とスタッフ（独自認証）の両方に対応
 */
export default function RoleBasedView({
  children,
  requiredRole,
  fallback = null,
}: RoleBasedViewProps) {
  // スタッフ認証とClerk認証の両方を取得
  const { role: staffRole, checkPermission, isAuthenticated: isStaffAuthenticated } = useStaffAuth();
  const { isSignedIn } = useAuth();

  // スタッフとして認証されているかどうかを最優先
  // スタッフとして認証されていない場合のみClerk認証を考慮
  const isOwner = isSignedIn && !isStaffAuthenticated;
  
  // 権限チェック
  // 1. スタッフ認証の場合：役割に基づくアクセス制御
  // 2. オーナーの場合：常に最高権限
  const hasAccess = isStaffAuthenticated 
    ? (staffRole && checkPermission(requiredRole)) 
    : isOwner;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}