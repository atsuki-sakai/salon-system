"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function NotFound() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardHeader className="pb-0">
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 2, 0, -2, 0],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 4,
                }}
              >
                <div className="rounded-full bg-red-100 p-4">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
              </motion.div>
            </div>
            <CardTitle className="text-center">
              <span className="text-6xl font-bold text-gray-900">404</span>
              <span className="text-2xl font-medium text-gray-500 ml-2">
                Error
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 pb-4">
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
              予期せぬエラーが発生しました
            </h2>
            <p className="text-gray-600 text-center mb-6">
              申し訳ありません、予期せぬエラーが発生しました。
              <br />
              時間をおいて再度お試しください。
            </p>

            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />

            <p className="text-sm text-gray-500">
              このエラーが続く場合は、カスタマーサポートまでお問い合わせください。
            </p>
            <a
              className="inline-block w-full text-sm text-indigo-500 underline mt-2 text-end"
              href="mailto:atk721@icloud.com"
            >
              atk721@icloud.com
            </a>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-6">
            <Button
              onClick={handleRefresh}
              className="w-full sm:w-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>再読み込みする</span>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
