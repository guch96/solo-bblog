import Link from "next/link";
import { Button } from "@/components/ui/button";
import RecordList from "@/components/records/RecordList";

export const dynamic = "force-dynamic";

export default function RecordsPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">记录列表</h1>
        <Link href="/records/new">
          <Button>新增记录</Button>
        </Link>
      </div>
      <RecordList />
    </div>
  );
}
