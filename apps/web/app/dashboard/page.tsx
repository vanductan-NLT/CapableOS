import { DashboardIcon } from "@orchestra/ui";
import { PageHeader } from "@/components/page-header";
import { DashboardView } from "@/features/dashboard/dashboard-view";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Performance"
        title="Năng suất người & AI"
        lead="Đo sự thật công bằng trên cùng một thước đo — phân bổ quyết định, dòng chảy (DORA) và chất lượng."
        icon={<DashboardIcon size={20} />}
      />
      <DashboardView />
    </div>
  );
}
