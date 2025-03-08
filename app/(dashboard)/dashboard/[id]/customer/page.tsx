"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserCircle,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CustomerPage() {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("lastName");
  const [sortDirection, setSortDirection] = useState("asc");

  // usePaginatedQuery フックを利用。ここでは salonId と sortDirection を渡します。
  // ページ分割されたクエリは内部でカーソルを管理するため、初期取得件数を third 引数で指定します。
  const {
    results: customers,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.customer.getCustomersBySalonId,
    { salonId: id as string, sortDirection: "desc" },
    { initialNumItems: 10 }
  );

  // クライアント側でさらに検索・フィルタ・ソート（ページ内での加工）
  const filteredCustomers = customers
    ? customers
        .filter(
          (customer) =>
            customer.firstName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            customer.lastName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
          const fieldA = a[sortField as keyof typeof a] || "";
          const fieldB = b[sortField as keyof typeof b] || "";
          if (sortDirection === "asc") {
            return fieldA > fieldB ? 1 : -1;
          } else {
            return fieldA < fieldB ? 1 : -1;
          }
        })
    : [];

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  // 初回ページ読み込み中はスケルトン表示
  if (status === "LoadingFirstPage") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>顧客一覧</CardTitle>
          <CardDescription>サロンの顧客データを管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">顧客一覧</CardTitle>
          <CardDescription>
            {filteredCustomers.length}人の顧客がサロンに登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 検索とフィルター */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="顧客を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* <Button
              variant="outline"
              className="ml-auto"
              onClick={() =>
                (window.location.href = `/customers/new?salonId=${id}`)
              }
            >
              新規顧客登録
            </Button> */}
          </div>

          {/* 顧客テーブル */}
          <div className="rounded-md border">
            <Table>
              {filteredCustomers.length === 0 && (
                <TableCaption>登録された顧客はありません</TableCaption>
              )}
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer w-[240px]"
                    onClick={() => toggleSort("lastName")}
                  >
                    <div className="flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      氏名
                      <SortIndicator field="lastName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => toggleSort("email")}
                  >
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      メール
                      <SortIndicator field="email" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden sm:table-cell"
                    onClick={() => toggleSort("phone")}
                  >
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      電話番号
                      <SortIndicator field="phone" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden lg:table-cell"
                    onClick={() => toggleSort("lastReservationDate")}
                  >
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      最終予約日
                      <SortIndicator field="lastReservationDate" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer._id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        {customer.lastName} {customer.firstName}
                      </div>
                      {customer.tags && customer.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {customer.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-default">
                            <span className="truncate max-w-[200px] block">
                              {customer.email}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{customer.email}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {customer.phone}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {customer.lastReservationDate || "予約なし"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              (window.location.href = `/customers/${customer._id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            <span>詳細</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              (window.location.href = `/customers/${customer._id}/edit`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            <span>編集</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (
                                confirm("この顧客を削除してもよろしいですか？")
                              ) {
                                // 削除APIの呼び出しをここに実装
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>削除</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Load Moreボタン */}
          {status === "CanLoadMore" && (
            <div className="mt-4 text-center">
              <Button onClick={() => loadMore(5)}>Load More</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
