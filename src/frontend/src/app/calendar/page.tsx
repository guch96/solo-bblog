import CalendarHeatmap from "@/components/calendar/CalendarHeatmap";

export default function CalendarPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">日历视图</h1>
      <CalendarHeatmap />
    </div>
  );
}
