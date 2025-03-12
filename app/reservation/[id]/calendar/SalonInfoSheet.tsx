// サロン情報モバイルサイドシート
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";
import { FileImage } from "@/components/common";
import { Phone, Mail, ClockIcon, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const SalonInfoSheet: React.FC<{
  salonConfig: Doc<"salon_config"> | null;
}> = ({ salonConfig }) => {
  if (!salonConfig) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 px-2 gap-1 sm:hidden bg-indigo-50 text-indigo-700 border-indigo-200"
        >
          <InfoIcon className="h-3 w-3" />
          サロン情報
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>サロン情報</SheetTitle>
          <SheetDescription>{salonConfig.salonName}の詳細情報</SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          {salonConfig?.imgFileId && (
            <div className="flex flex-col items-center">
              <div className="overflow-hidden shadow-sm mb-3 w-full max-w-[200px]">
                <FileImage
                  fileId={salonConfig.imgFileId}
                  alt={salonConfig.salonName}
                  size={300}
                  fullSize
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {salonConfig.salonName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {salonConfig.address}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                連絡先
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="h-4 w-4" />
                  <a
                    className="hover:underline"
                    href={`tel:${salonConfig?.phone}`}
                  >
                    {salonConfig?.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-4 w-4 " />
                  <a
                    className="hover:underline"
                    href={`mailto:${salonConfig?.email}`}
                  >
                    {salonConfig?.email}
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                営業情報
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <ClockIcon className="h-4 w-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-gray-800">
                      {salonConfig?.regularOpenTime} 〜{" "}
                      {salonConfig?.regularCloseTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">
                      定休日
                    </h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {salonConfig?.regularHolidays
                        ?.slice(0, 6)
                        .map((holiday) => (
                          <Badge
                            key={holiday}
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 text-xs px-2 py-1"
                          >
                            {holiday}
                          </Badge>
                        ))}
                      <p className="text-xs text-gray-500">
                        直近の定休日を表示しています。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {salonConfig?.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  サロン概要
                </h4>
                <p className="text-sm text-gray-600 tracking-wide leading-5">
                  {salonConfig.description}
                </p>
              </div>
            )}

            {salonConfig?.reservationRules && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  予約時の注意事項
                </h4>
                <p className="text-xs text-blue-700">
                  {salonConfig.reservationRules}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
