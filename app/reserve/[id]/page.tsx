"use client";

import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useZodForm } from "@/hooks/useZodForm";
import { z } from "zod";
import { customerAddSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { setCookie, getCookie } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { OriginalBreadcrumb } from "@/components/common/OriginalBreadcrumb";
export default function ReservePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [confirmRegister, setConfirmRegister] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useZodForm(customerAddSchema, {
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      salonId: id,
    },
  });

  const addCustomer = useMutation(api.customer.add);
  const updateCustomer = useMutation(api.customer.update);
  const salonCustomers = usePaginatedQuery(
    api.customer.getCustomersBySalonId,
    {
      salonId: id,
    },
    {
      initialNumItems: 10,
    }
  );

  const onSubmit = async (data: z.infer<typeof customerAddSchema>) => {
    try {
      const existingCustomer = salonCustomers?.results.find(
        (customer) => customer.email === data.email
      );
      if (existingCustomer) {
        console.log("customer already exists");
        const customer = await updateCustomer({
          id: existingCustomer._id as Id<"customer">,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email ?? "",
        });
        console.log(customer);
        const customerData = JSON.stringify({
          _id: existingCustomer._id as Id<"customer">,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email ?? "",
        });
        setCookie("__salonapp_session", customerData, 60); // 60日間保存
        router.push(`/reserve/${id}/calendar`);
        return;
      } else {
        if (confirmRegister) {
          const customerId = await addCustomer({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email ?? "",
            salonId: data.salonId,
          });

          const customerData = JSON.stringify({
            _id: customerId,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
          });
          setCookie("__salonapp_session", customerData, 60); // 60日間保存
          router.push(`/reserve/${id}/calendar`);
        } else {
          const customerData = JSON.stringify({
            _id: "only_session",
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
          });
          setCookie("__salonapp_session", customerData, 60); // 60日間保存
          router.push(`/reserve/${id}/calendar`);
        }
      }
    } catch (error) {
      console.error("予約エラー:", error);
      // エラーハンドリングを追加
    }
  };

  // フォーム初期化時にクッキーからデータを読み込む
  useEffect(() => {
    const customerDataStr = getCookie("__salonapp_session");
    if (customerDataStr) {
      try {
        const data = JSON.parse(customerDataStr);
        Object.entries(data).forEach(([key, value]) => {
          setValue(
            key as "firstName" | "lastName" | "phone" | "email",
            value as string
          );
        });
      } catch (error) {
        console.error("クッキーデータの解析エラー:", error);
      }
    }
  }, [setValue, salonCustomers]);

  const breadcrumbItems = [{ label: "予約者情報の設定", href: `` }];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col items-center justify-center mx-4 py-5">
        <div className="flex flex-col gap-3  w-full">
          <OriginalBreadcrumb items={breadcrumbItems} />
          <h1 className="text-2xl font-bold">予約者情報の設定</h1>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 w-full my-5"
        >
          <div>
            <Label htmlFor="lastName">苗字</Label>
            <Input placeholder="苗字" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-red-500  text-sm mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="firstName">名前</Label>
            <Input placeholder="名前" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-red-500  text-sm mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">電話番号</Label>
            <Input placeholder="電話番号" {...register("phone")} />
            {errors.phone && (
              <p className="text-red-500  text-sm mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input placeholder="メールアドレス" {...register("email")} />
            {errors.email && (
              <p className="text-red-500  text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="confirmRegister"
              checked={confirmRegister}
              onCheckedChange={(checked: boolean) =>
                setConfirmRegister(checked)
              }
            />
            <Label htmlFor="confirmRegister" className="text-xs">
              予約情報を保存し次回からの予約時に自動入力します。
            </Label>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              次へ
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
