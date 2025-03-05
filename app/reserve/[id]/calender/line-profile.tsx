"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useZodForm } from "@/hooks/useZodForm";
import { phoneSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useLiff } from "@/components/providers/liff-provider";
import { toast } from "sonner";
import { redirect } from "next/navigation";

export function Profile({ id }: { id: string }) {
  const { isLoggedIn, profile } = useLiff();
  const [phoneNumber, setPhoneNumber] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useZodForm(phoneSchema);

  const customer = useQuery(
    api.customers.getCustomerByUid,
    profile?.userId ? { uid: profile.userId } : "skip"
  );

  useEffect(() => {
    if (isLoggedIn && profile && customer) {
      console.log("Customer data:", customer);
      setPhoneNumber(customer.phone ?? "");
    }
  }, [isLoggedIn, profile, customer]);

  const createCustomer = useMutation(api.customers.createCustomer);
  const updateCustomer = useMutation(api.customers.updateCustomer);

  const onSubmit = async (data: { phone: string }) => {
    if (!profile?.userId || !data.phone) return;

    try {
      console.log("Current customer:", customer);
      if (customer) {
        console.log("Updating existing customer:", customer);
        updateCustomer({
          uid: profile.userId,
          email: profile?.email ?? "",
          phone: phoneNumber,
          name: profile?.displayName ?? "",
          salonIds: customer.salonIds.concat(id),
        });
      } else {
        createCustomer({
          uid: profile.userId,
          email: profile?.email ?? "",
          phone: phoneNumber,
          name: profile?.displayName ?? "",
          salonIds: [id],
        });
      }
      toast.success("予約者情報を登録しました");
    } catch (error) {
      console.error("登録エラー:", error);
      toast.error("予約者情報の登録に失敗しました");
    }
  };

  if (!profile) {
    return redirect(`/reserve/${id}`);
  }

  return (
    <Card className="w-full max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle>Line予約</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.pictureUrl} alt={profile.displayName} />
              <AvatarFallback>{profile.displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{profile.displayName}</h3>
              {profile.email && (
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="090-1234-5678"
                {...register("phone")}
                required
              />
              {errors.phone && (
                <p className="mt-1 text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="flex justify-center gap-2">
              <Button
                variant="default"
                type="submit"
                className="w-2/5 bg-green-600 font-bold text-white"
                disabled={isSubmitted}
              >
                予約者情報を入力
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
