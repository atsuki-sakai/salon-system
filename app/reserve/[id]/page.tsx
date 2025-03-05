"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLiff } from "@/components/providers/liff-provider";
import { useParams } from "next/navigation";
import { useZodForm } from "@/hooks/useZodForm";
import { customerSchema } from "@/lib/validations";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function ReservePage() {
  const params = useParams();
  const id = params.id as string;
  const { liff, isLoggedIn, profile } = useLiff();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(customerSchema);

  const handleLineLogin = () => {
    console.log("handleLogin");
    console.log("isLoggedIn", isLoggedIn);
    console.log("profile", profile);
    console.log("liff?.isInClient()", liff?.isInClient());

    console.log("salonId: ", id);

    // 現在のURLを複製
    const currentUrl = new URL(window.location.href);

    // URLから既存のクエリパラメータを削除
    // LIFFは内部的にliff.stateを使うので、余計なパラメータを消しておく
    currentUrl.search = "";

    // パスの一部としてsalonIdを含める（liff.stateとの重複を避けるため）
    let pathWithoutTrailingSlash = currentUrl.pathname;
    if (pathWithoutTrailingSlash.endsWith("/")) {
      pathWithoutTrailingSlash = pathWithoutTrailingSlash.slice(0, -1);
    }

    currentUrl.pathname = `${pathWithoutTrailingSlash}`;

    console.log("リダイレクト先URLのベース: ", currentUrl.toString());

    // LIFFログイン - 内部的にliff.stateを生成する
    liff?.login({
      redirectUri: currentUrl.toString() + `/calender`,
    });
  };

  const generateUid = () => {
    return Math.random().toString(36).substring(2, 15).toString();
  };

  const createCustomer = useMutation(api.customers.createCustomer);
  const onSubmit = async (data: {
    name: string;
    phone: string;
    email?: string;
  }) => {
    console.log(data);
    try {
      const customer = await createCustomer({
        uid: generateUid(),
        name: data.name,
        phone: data.phone,
        email: data.email || "",
        salonIds: [id],
      });
      console.log("customer", customer);
      toast.success("予約者情報を登録しました");
    } catch (error) {
      console.error(error);
      toast.error("予約者情報の登録に失敗しました");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div>
          <Label htmlFor="name">
            お名前{" "}
            <span className="text-red-500 text-xs scale-75 inline-block ml-1 w-fit border border-red-500 rounded-md px-1">
              必須
            </span>
          </Label>
          <Input
            type="text"
            id="name"
            placeholder="例：山田太郎"
            required
            {...register("name")}
          />
          {errors.name && <p>{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">
            電話番号{" "}
            <span className="text-red-500 text-xs scale-75 inline-block ml-1 w-fit border border-red-500 rounded-md px-1">
              必須
            </span>
          </Label>
          <Input
            type="text"
            id="phone"
            placeholder="例：090-1234-5678"
            required
            {...register("phone")}
          />
          {errors.phone && <p>{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            type="email"
            id="email"
            {...register("email")}
            placeholder="例：example@example.com"
          />
          {errors.email && <p>{errors.email.message}</p>}
        </div>
        <div>
          <Button className="w-full mt-3" type="submit" disabled={isSubmitting}>
            登録する
          </Button>
        </div>
      </form>
      <div className="flex items-center justify-center my-4">
        <span className="text-gray-500">or</span>
      </div>
      <Button
        variant="outline"
        className=" bg-green-600 text-white"
        onClick={handleLineLogin}
      >
        LINEでログイン
      </Button>
    </div>
  );
}
