"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSalonCore } from "@/hooks/useSalonCore";
import { clearSalonCoreAtoms } from "@/lib/atoms/salonCoreAtoms";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import RoleBasedView from "./RoleBasedView";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClerk, useAuth } from "@clerk/nextjs";
import {
  Calendar,
  Home,
  Settings,
  Users,
  FileText,
  User,
  CreditCard,
  LogOut,
  Menu as MenuIcon,
  ChevronDown,
  X,
} from "lucide-react";

// アニメーション設定
const sidebarAnimation = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      staggerChildren: 0.05,
      duration: 0.3,
    },
  },
};

const itemAnimation = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

// ヘルパー関数
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { signOut, user: salon } = useClerk();
  const { isSignedIn } = useAuth();
  const { salonCore, isLoading } = useSalonCore();
  const {
    isAuthenticated: isStaffAuthenticated,
    logout: staffLogout,
    name: staffName,
    role: staffRole,
    salonId,
  } = useStaffAuth();
  const pathname = usePathname();

  // オーナーかスタッフかを判定
  const isOwner = isSignedIn && !isStaffAuthenticated;

  // リンクのベースパス
  const basePath = `/dashboard/${salon?.id}`;

  // ナビゲーション項目の定義
  const navigation = [
    {
      name: "ダッシュボード",
      href: basePath,
      icon: Home,
      requiredRole: "staff",
    },
    {
      name: "予約カレンダー",
      href: `${basePath}/reservation`,
      icon: Calendar,
      requiredRole: "staff",
    },
    {
      name: "スタッフ一覧",
      href: `${basePath}/staff`,
      icon: Users,
      requiredRole: "admin",
    },
    {
      name: "メニュー一覧",
      href: `${basePath}/menu`,
      icon: FileText,
      requiredRole: "manager",
    },
    {
      name: "顧客一覧",
      href: `${basePath}/customer`,
      icon: User,
      requiredRole: "manager",
    },
  ];

  // オーナーのみに表示する項目
  const ownerOnlyNavigation = [
    {
      name: "サブスクリプション",
      href: `${basePath}/subscription`,
      icon: CreditCard,
    },
  ];

  // オーナーログアウト処理
  const handleOwnerSignOut = () => {
    clearSalonCoreAtoms();
    signOut(() => {
      window.location.href = "/sign-in";
    });
  };

  // スタッフログアウト処理
  const handleStaffSignOut = () => {
    if (salonId) {
      staffLogout(salonId);
    }
  };

  // ハイドレーション対策
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* モバイル用サイドバー */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">メニューを開く</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <div className="flex h-full flex-col overflow-y-auto bg-white">
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-800 bg-clip-text text-transparent">
                  Booker
                </h1>
                <p className="text-xs text-slate-500">
                  サロンの予約・管理をもっと簡単に。
                </p>
              </div>
              <SheetClose className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none">
                <X className="h-5 w-5" />
                <span className="sr-only">閉じる</span>
              </SheetClose>
            </div>
            <motion.nav
              initial="hidden"
              animate="visible"
              variants={sidebarAnimation}
              className="flex flex-1 flex-col px-6"
            >
              <ul className="space-y-1 py-4">
                {navigation.map((item) => {
                  const isCurrent = pathname === item.href;

                  const linkContent = (
                    <motion.div variants={itemAnimation} key={item.name}>
                      <Link
                        href={item.href}
                        className={classNames(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isCurrent
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                        )}
                      >
                        <item.icon
                          className={classNames(
                            "h-5 w-5",
                            isCurrent ? "text-blue-700" : "text-gray-500"
                          )}
                        />
                        {item.name}
                      </Link>
                    </motion.div>
                  );

                  // 権限に基づいた表示
                  if (isOwner) {
                    return linkContent;
                  } else if (item.requiredRole) {
                    return (
                      <RoleBasedView
                        key={item.name}
                        requiredRole={
                          item.requiredRole as "staff" | "admin" | "manager"
                        }
                      >
                        {linkContent}
                      </RoleBasedView>
                    );
                  }
                  return null;
                })}

                {/* オーナーにのみ表示する項目 */}
                {isOwner &&
                  ownerOnlyNavigation.map((item) => {
                    const isCurrent = pathname === item.href;
                    return (
                      <motion.div variants={itemAnimation} key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                            isCurrent
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                          )}
                        >
                          <item.icon
                            className={classNames(
                              "h-5 w-5",
                              isCurrent ? "text-blue-700" : "text-gray-500"
                            )}
                          />
                          {item.name}
                        </Link>
                      </motion.div>
                    );
                  })}
              </ul>

              <div className="mt-auto space-y-1 py-4 border-t border-gray-100">
                <motion.div variants={itemAnimation}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                    onClick={isOwner ? handleOwnerSignOut : handleStaffSignOut}
                  >
                    <LogOut className="mr-2 h-5 w-5 text-gray-500" />
                    ログアウト
                  </Button>
                </motion.div>
                <motion.div variants={itemAnimation}>
                  <Link href={`${basePath}/setting`}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                    >
                      <Settings className="mr-2 h-5 w-5 text-gray-500" />
                      設定
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* デスクトップ用サイドバー */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "18rem" }}
          className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:pt-5 lg:bg-white lg:w-72"
        >
          <div className="px-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-800 bg-clip-text text-transparent">
              Booker
            </h1>
            <p className="text-xs text-slate-500">
              サロンの予約・管理をもっと簡単に。
            </p>
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={sidebarAnimation}
            className="mt-8 flex flex-1 flex-col overflow-y-auto"
          >
            <nav className="flex-1 px-4">
              <ul className="space-y-1.5">
                {navigation.map((item) => {
                  const isCurrent = pathname === item.href;

                  const linkContent = (
                    <motion.li variants={itemAnimation} key={item.name}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              className={classNames(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                                isCurrent
                                  ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                                  : "text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                              )}
                            >
                              <item.icon
                                className={classNames(
                                  "h-5 w-5",
                                  isCurrent ? "text-blue-700" : "text-gray-500"
                                )}
                              />
                              {item.name}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.name}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </motion.li>
                  );

                  // 権限に基づいた表示
                  if (isOwner) {
                    return linkContent;
                  } else if (item.requiredRole) {
                    return (
                      <RoleBasedView
                        key={item.name}
                        requiredRole={
                          item.requiredRole as "staff" | "admin" | "manager"
                        }
                      >
                        {linkContent}
                      </RoleBasedView>
                    );
                  }
                  return null;
                })}

                {/* オーナーにのみ表示する項目 */}
                {isOwner &&
                  ownerOnlyNavigation.map((item) => {
                    const isCurrent = pathname === item.href;
                    return (
                      <motion.li variants={itemAnimation} key={item.name}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={item.href}
                                className={classNames(
                                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                                  isCurrent
                                    ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                                    : "text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                                )}
                              >
                                <item.icon
                                  className={classNames(
                                    "h-5 w-5",
                                    isCurrent
                                      ? "text-blue-700"
                                      : "text-gray-500"
                                  )}
                                />
                                {item.name}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </motion.li>
                    );
                  })}
              </ul>
            </nav>

            <div className="mt-auto px-4 pb-6 border-t border-gray-100 pt-4">
              <motion.div variants={itemAnimation}>
                <Link href={`${basePath}/setting`}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                  >
                    <Settings className="mr-2 h-5 w-5 text-gray-500" />
                    設定
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* メインコンテンツエリア */}
      <div className="flex flex-col flex-1 lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex flex-1 items-center justify-between">
            <div></div>
            <div className="flex items-center gap-4">
              {/* プロプランバッジ */}
              {isOwner && salonCore?.subscriptionStatus === "active" && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 font-medium"
                >
                  プロプラン
                </Badge>
              )}

              {/* スタッフバッジ */}
              {!isOwner && staffRole && (
                <Badge
                  variant="outline"
                  className={classNames(
                    "font-medium",
                    staffRole === "admin"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : staffRole === "manager"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                >
                  {staffRole === "admin"
                    ? "管理者"
                    : staffRole === "manager"
                      ? "マネージャー"
                      : "スタッフ"}
                </Badge>
              )}

              {/* ユーザーメニュー */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-sm font-normal"
                  >
                    <span>
                      {isOwner
                        ? isLoading
                          ? "読み込み中..."
                          : salonCore?.email
                        : staffName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {isOwner && (
                    <DropdownMenuItem asChild>
                      <Link href={`${basePath}/setting/change-password`}>
                        パスワード変更
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={isOwner ? handleOwnerSignOut : handleStaffSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 py-10 px-4 sm:px-6 lg:px-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}