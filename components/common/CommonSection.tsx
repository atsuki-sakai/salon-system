import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
interface SectionContainerProps {
  children: React.ReactNode;
  title: string;
  backLink: string;
  backLinkTitle: string;
  infoBtn?: {
    text: string;
    link: string;
  };
}

export default function CommonSection({
  children,
  title,
  backLink,
  backLinkTitle,
  infoBtn,
}: SectionContainerProps) {
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center">
        <div className=" flex flex-col gap-2 mb-6 bg-white py-4 z-10">
          <div className="flex justify-between items-center">
            <Link href={backLink} className="group">
              <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>{backLinkTitle}</span>
              </span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>
        {infoBtn && (
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Link href={infoBtn.link}>{infoBtn.text}</Link>
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}
