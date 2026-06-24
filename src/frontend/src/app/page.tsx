import Link from "next/link";
import { Button } from "@/components/ui/button";
import { recordsApi } from "@/lib/api";
import type { RecordData } from "@/lib/types";
import Timer from "@/components/timer/Timer";
import RecordCard from "@/components/records/RecordCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = new Date().toISOString().slice(0, 10);
  let todayRecords: RecordData[] = [];
  try {
    todayRecords = await recordsApi.list({
      date_from: today,
      date_to: today,
    });
  } catch {
    // 后端未启动时显示空状态
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4 text-center">计时记录</h2>
        <Timer />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">今日记录</h2>
          <Link href="/records/new?input_mode=manual">
            <Button variant="outline" size="sm">
              手动记录
            </Button>
          </Link>
        </div>

        {todayRecords.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            今天还没有记录
          </p>
        ) : (
          <div className="space-y-3">
            {todayRecords.map((r) => (
              <RecordCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
