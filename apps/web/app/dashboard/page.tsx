import { DashboardView } from "@/features/dashboard/dashboard-view";
import { PageContainer } from "@/components/page-container";

export default function DashboardPage() {
  return (
    <PageContainer
      title={{ vi: "Hiệu quả vận hành", en: "Operational performance" }}
      description={{
        vi: "So sánh người và AI trên tốc độ, chi phí, chất lượng và điểm kẹt.",
        en: "Compare people and AI on speed, cost, quality and bottlenecks.",
      }}
    >
      <DashboardView />
    </PageContainer>
  );
}
