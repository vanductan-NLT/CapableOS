import { DashboardView } from "@/features/dashboard/dashboard-view";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Performance Dashboard</h1>
        <p className="text-sm text-muted">Năng suất người và AI trên cùng thước đo.</p>
      </div>
      <DashboardView />
    </div>
  );
}
