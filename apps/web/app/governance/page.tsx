import { PageContainer } from "@/components/page-container";
import { GovernanceWorkbench } from "@/features/task/governance-workbench";

export default function GovernancePage() {
  return (
    <PageContainer
      title="Phê duyệt & kiểm soát"
      description="Duyệt việc rủi ro, giữ quyền quyết định cho con người và xem luật đang bảo vệ quy trình."
    >
      <GovernanceWorkbench />
    </PageContainer>
  );
}
