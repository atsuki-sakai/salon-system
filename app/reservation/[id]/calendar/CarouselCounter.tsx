// カルーセルカウンターコンポーネント
import React from "react";
import { CarouselApi } from "@/components/ui/carousel";

export const CarouselCounter = ({
  api,
  totalItems,
}: {
  api: CarouselApi | null;
  totalItems: number;
}) => {
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border shadow-sm">
      {current} / {totalItems}
    </div>
  );
};
