import { PageContainer } from "@/components/page-container";
import { GovernanceWorkbench } from "@/features/task/governance-workbench";

export default function GovernancePage() {
  return (
    <PageContainer
      title={{ vi: "Phê duyệt & kiểm soát", en: "Approvals & control" }}
      description={{
        vi: "Duyệt việc rủi ro, giữ quyền quyết định cho con người và xem luật đang bảo vệ quy trình.",
        en: "Approve risky work, keep decision rights with people, and see which rules protect the process.",
      }}
    >
      <GovernanceWorkbench />
    </PageContainer>
  );
}
