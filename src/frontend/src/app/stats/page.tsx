import StatsCharts from "@/components/charts/StatsCharts";

export default function StatsPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">数据统计</h1>
      <StatsCharts />
    </div>
  );
}
