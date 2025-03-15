"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import RoleBasedView from "./RoleBasedView";

import {
  Calendar,
  Users,
  Settings,
  Menu,
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";

export function StaffSidebar() {
  const pathname = usePathname();
  const { name, role, logout, loading, salonId } = useStaffAuth();
  const [isOpen, setIsOpen] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // レスポンシブ対応
  useEffect(() => {
    if (isDesktop) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isDesktop]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const NavLink = ({
    href,
    icon,
    label,
    requiredRole,
  }: {
    href: string;
    icon: React.ReactNode;
    label: string;
    requiredRole?: "admin" | "manager" | "staff";
  }) => {
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);
    const linkContent = (
      <Button
        variant="ghost"
        size="lg"
        className={cn(
          "w-full justify-start",
          isActive ? "bg-muted" : "hover:bg-muted/50"
        )}
        onClick={() => !isDesktop && setIsOpen(false)}
      >
        <div className="flex items-center">
          <div className="mr-3">{icon}</div>
          {isOpen && <span>{label}</span>}
        </div>
      </Button>
    );

    if (requiredRole) {
      return (
        <RoleBasedView requiredRole={requiredRole}>
          <Link href={href}>{linkContent}</Link>
        </RoleBasedView>
      );
    }

    return <Link href={href}>{linkContent}</Link>;
  };

  if (loading) {
    return (
      <div
        className={`h-full bg-card border-r border-border transition-all duration-300 ${isOpen ? "w-60" : "w-16"}`}
      >
        <div className="p-4 h-full">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-6 w-24" />
            <Button size="icon" variant="ghost">
              <ChevronLeft size={16} />
            </Button>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // if (!isAuthenticated) {
  //   router.push('/staff-auth');
  //   return null;
  // }

  return (
    <div
      className={cn(
        "h-full bg-card border-r border-border transition-all duration-300 relative",
        isOpen ? "w-60" : "w-16"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-3 translate-x-1/2 z-10 rounded-full border shadow-md bg-background"
        onClick={toggleSidebar}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </Button>

      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          {isOpen ? (
            <div className="font-semibold text-lg">スタッフポータル</div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              S
            </div>
          )}
        </div>

        {/* スタッフ情報 */}
        <div className="mb-6 flex items-center">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 mr-2">
            <User size={16} />
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <div className="font-medium truncate">{name || "スタッフ"}</div>
              <div className="text-xs text-muted-foreground">
                {role || "ロール未設定"}
              </div>
            </div>
          )}
        </div>

        <Separator className="mb-4" />

        <nav className="space-y-2 flex-1">
          <NavLink
            href="/staff-portal"
            icon={<Home size={18} />}
            label="ダッシュボード"
          />
          <NavLink
            href="/staff-portal/reservations"
            icon={<Calendar size={18} />}
            label="予約管理"
          />
          <NavLink
            href="/staff-portal/customers"
            icon={<Users size={18} />}
            label="顧客管理"
            requiredRole="manager"
          />
          <NavLink
            href="/staff-portal/menu"
            icon={<Menu size={18} />}
            label="メニュー管理"
            requiredRole="manager"
          />
          <RoleBasedView requiredRole="admin">
            <NavLink
              href="/staff-portal/admin/settings"
              icon={<Settings size={18} />}
              label="サロン設定"
            />
          </RoleBasedView>
        </nav>

        <Separator className="my-4" />

        {isOpen ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => logout(salonId!)}
          >
            <LogOut size={18} className="mr-2" />
            ログアウト
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={() => logout(salonId!)}
          >
            <LogOut size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}
