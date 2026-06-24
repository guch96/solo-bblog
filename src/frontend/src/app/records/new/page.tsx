import RecordForm from "@/components/records/RecordForm";

export default function NewRecordPage() {
  return (
    <div className="container max-w-lg mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">新增记录</h1>
      <RecordForm />
    </div>
  );
}
