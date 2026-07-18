import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFoundPage = () => {
  return (
    // 通常のフロー内で上から配置し、上部に余白を広めに取る (error.tsx と同じ構成)
    <div className="flex flex-col items-center gap-6 pt-24 sm:pt-32">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-amber-100 p-3 rounded-full">
            <SearchXIcon className="size-10 text-amber-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            ページが見つかりません
          </h2>
          <p className="text-muted-foreground">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>
      </div>
      <Button asChild className="font-medium">
        <Link href="/">トップページへ戻る</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
