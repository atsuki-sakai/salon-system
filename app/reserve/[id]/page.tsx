"use client";

import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useZodForm } from "@/hooks/useZodForm";
import { z } from "zod";
import { customerSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { setCookie, getCookie } from "@/lib/utils";

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
  } = useZodForm(customerSchema, {
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      salonIds: [id],
    },
  });

  const generateUid = () => {
    return "customer_" + Math.random().toString(36).substring(2, 15);
  };

  const createCustomer = useMutation(api.customers.createCustomer);
  const updateCustomer = useMutation(api.customers.updateCustomer);
  const salonCustomers = useQuery(api.customers.getCustomersBySalonId, {
    salonId: id,
  });

  const onSubmit = async (data: z.infer<typeof customerSchema>) => {
    try {
      if (confirmRegister) {
        const existingCustomer = salonCustomers?.find(
          (customer) => customer.email === data.email
        );
        if (existingCustomer) {
          console.log("customer already exists");
          const customer = await updateCustomer({
            uid: existingCustomer.uid,
            name: data.name,
            phone: data.phone,
            email: data.email ?? "",
            salonIds: data.salonIds.concat(id),
          });
          console.log(customer);
          const customerData = JSON.stringify({
            uid: existingCustomer.uid,
            name: data.name,
            phone: data.phone,
            email: data.email,
          });
          setCookie("customerData", customerData, 60); // 60日間保存
          router.push(`/reserve/${id}/calendar/?uid=${existingCustomer.uid}`);
        } else {
          const uid = generateUid();
          const customer = await createCustomer({
            uid: uid,
            name: data.name,
            phone: data.phone,
            email: data.email ?? "",
            salonIds: data.salonIds,
          });
          console.log(customer);
          const customerData = JSON.stringify({
            uid: uid,
            name: data.name,
            phone: data.phone,
            email: data.email,
          });
          setCookie("customerData", customerData, 60); // 60日間保存
          router.push(`/reserve/${id}/calendar?uid=${uid}`);
        }
      }
    } catch (error) {
      console.error("予約エラー:", error);
      // エラーハンドリングを追加
    }
  };

  // フォーム初期化時にクッキーからデータを読み込む
  useEffect(() => {
    const customerDataStr = getCookie("customerData");
    if (customerDataStr) {
      try {
        const data = JSON.parse(customerDataStr);
        Object.entries(data).forEach(([key, value]) => {
          setValue(key as "name" | "phone" | "email", value as string);
        });
      } catch (error) {
        console.error("クッキーデータの解析エラー:", error);
      }
    }
  }, [setValue, salonCustomers]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">名前</Label>
          <Input placeholder="名前" {...register("name")} />
          {errors.name && (
            <p className="text-red-500  text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">電話番号</Label>
          <Input placeholder="電話番号" {...register("phone")} />
          {errors.phone && (
            <p className="text-red-500  text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input placeholder="メールアドレス" {...register("email")} />
          {errors.email && (
            <p className="text-red-500  text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="confirmRegister"
            checked={confirmRegister}
            onCheckedChange={(checked: boolean) => setConfirmRegister(checked)}
          />
          <Label htmlFor="confirmRegister" className="text-xs">
            予約情報を保持次回からの予約時に自動入力します。
          </Label>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            予約する
          </Button>
        </div>
      </form>
    </div>
  );
}
