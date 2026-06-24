import { recordsApi } from "@/lib/api";
import RecordCard from "./RecordCard";

export default async function RecordList() {
  let records;
  try {
    records = await recordsApi.list();
  } catch {
    return (
      <div className="text-center text-muted-foreground py-12">
        加载记录失败，请确认后端服务已启动
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        暂无记录，开始记录你的第一条如厕数据吧！
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <RecordCard key={r.id} record={r} />
      ))}
    </div>
  );
}
