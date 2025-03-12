// src/components/common/CommonDetailDialog.tsx
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommonDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image?: React.ReactNode; // 画像部分のノード
  title: string; // タイトル（名前など）
  subtitle?: string; // 補足情報（例：所要時間、年齢など）
  details?: React.ReactNode; // 詳細情報（説明文、各種バッジなど）
  footer?: React.ReactNode; // フッター部分（例：対応可能なスタッフ一覧など）
}

export const CommonDetailDialog: React.FC<CommonDetailDialogProps> = ({
  open,
  onOpenChange,
  image,
  title,
  subtitle,
  details,
  footer,
}: CommonDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-x-hidden overflow-y-auto rounded-lg h-fit max-h-[90vh] w-[90vw]">
        <div className="py-4 space-y-4">
          <div className="flex items-start gap-4">
            {image && (
              <div className="w-1/2 min-w-24 rounded-md overflow-hidden border border-gray-200">
                {image}
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-base text-gray-900">{title}</h3>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
              {details && (
                <div className="text-sm text-gray-600">{details}</div>
              )}
            </div>
          </div>
        </div>
        {footer && <div className="pt-6 border-t">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
};
