import { DashboardView } from "@/features/dashboard/dashboard-view";
import { PageContainer } from "@/components/page-container";

export default function DashboardPage() {
  return (
    <PageContainer title="Hiệu quả vận hành" description="So sánh người và AI trên tốc độ, chi phí, chất lượng và điểm kẹt.">
      <DashboardView />
    </PageContainer>
  );
}
