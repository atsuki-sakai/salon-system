import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// SortIndicator コンポーネント（サーバー側でも問題なく動作します）
const SortIndicator = ({
  field,
  currentSortField,
  currentSortDirection,
}: {
  field: string;
  currentSortField: string;
  currentSortDirection: string;
}) => {
  if (currentSortField !== field) return null;
  return currentSortDirection === "asc" ? (
    <ChevronUp className="ml-1 h-4 w-4" />
  ) : (
    <ChevronDown className="ml-1 h-4 w-4" />
  );
};

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    sortField?: string;
    sortDirection?: string;
  }>;
}) {
  const paramsData = await params;
  const searchParamsData = await searchParams;
  const searchTerm = searchParamsData.search || "";
  const sortField = searchParamsData.sortField || "lastName";
  const sortDirection = searchParamsData.sortDirection || "asc";

  // サーバー側で顧客データを取得
  const queryResult = await fetchQuery(api.customer.getCustomersBySalonId, {
    salonId: paramsData.id,
    sortDirection: "desc",
    paginationOpts: {
      numItems: 10,
      cursor: null,
    },
  });
  const customers = queryResult.page;
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
          {/* 検索フォーム（GET メソッドでサーバー再レンダリング） */}
          <form
            method="get"
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
          >
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="顧客を検索..."
                defaultValue={searchTerm}
                className="pl-8"
              />
            </div>
            <Button type="submit" variant="outline" className="ml-auto">
              検索
            </Button>
          </form>

          {/* 顧客テーブル */}
          <div className="rounded-md border">
            <Table>
              {filteredCustomers.length === 0 && (
                <TableCaption>登録された顧客はありません</TableCaption>
              )}
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">
                    <Link
                      href={`?search=${encodeURIComponent(searchTerm)}&sortField=lastName&sortDirection=${sortField === "lastName" && sortDirection === "asc" ? "desc" : "asc"}`}
                    >
                      <div className="flex items-center cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        氏名
                        <SortIndicator
                          field="lastName"
                          currentSortField={sortField}
                          currentSortDirection={sortDirection}
                        />
                      </div>
                    </Link>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Link
                      href={`?search=${encodeURIComponent(searchTerm)}&sortField=email&sortDirection=${sortField === "email" && sortDirection === "asc" ? "desc" : "asc"}`}
                    >
                      <div className="flex items-center cursor-pointer">
                        <Mail className="mr-2 h-4 w-4" />
                        メール
                        <SortIndicator
                          field="email"
                          currentSortField={sortField}
                          currentSortDirection={sortDirection}
                        />
                      </div>
                    </Link>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <Link
                      href={`?search=${encodeURIComponent(searchTerm)}&sortField=phone&sortDirection=${sortField === "phone" && sortDirection === "asc" ? "desc" : "asc"}`}
                    >
                      <div className="flex items-center cursor-pointer">
                        <Phone className="mr-2 h-4 w-4" />
                        電話番号
                        <SortIndicator
                          field="phone"
                          currentSortField={sortField}
                          currentSortDirection={sortDirection}
                        />
                      </div>
                    </Link>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Link
                      href={`?search=${encodeURIComponent(searchTerm)}&sortField=lastReservationDate&sortDirection=${sortField === "lastReservationDate" && sortDirection === "asc" ? "desc" : "asc"}`}
                    >
                      <div className="flex items-center cursor-pointer">
                        <Calendar className="mr-2 h-4 w-4" />
                        最終予約日
                        <SortIndicator
                          field="lastReservationDate"
                          currentSortField={sortField}
                          currentSortDirection={sortDirection}
                        />
                      </div>
                    </Link>
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
        </CardContent>
      </Card>
    </div>
  );
}
