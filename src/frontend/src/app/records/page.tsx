import Link from "next/link";
import { Button } from "@/components/ui/button";
import RecordList from "@/components/records/RecordList";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default function RecordsPage() {
  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">记录列表</h1>
          <p className="text-xs text-muted-foreground mt-0.5">管理与回顾所有记录</p>
        </div>
        <Link href="/records/new">
          <Button size="sm" className="gap-1 rounded-full">
            <Plus size={16} />
            新增记录
          </Button>
        </Link>
      </div>
      <RecordList />
    </div>
  );
}
