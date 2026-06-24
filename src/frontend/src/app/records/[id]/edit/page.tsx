"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RecordForm from "@/components/records/RecordForm";
import { recordsApi } from "@/lib/api";
import type { RecordData } from "@/lib/types";
import { toast } from "sonner";

export default function EditRecordPage() {
  const params = useParams();
  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordsApi
      .get(Number(params.id))
      .then(setRecord)
      .catch(() => toast.error("加载记录失败"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <p className="text-center text-muted-foreground py-12">加载中...</p>;
  }

  if (!record) {
    return <p className="text-center text-muted-foreground py-12">记录不存在</p>;
  }

  return (
    <div className="container max-w-lg mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">编辑记录</h1>
      <RecordForm record={record} />
    </div>
  );
}
