import { PageContainer } from "@/components/page-container";
import { MyWorkView } from "@/features/task/my-work-view";

export default function MyWorkPage() {
  return (
    <PageContainer
      title={{ vi: "Việc của tôi", en: "My work" }}
      description={{
        vi: "Nhận việc cần con người xử lý, review đầu ra AI và nộp kết quả.",
        en: "Take work that needs a human, review AI output and submit results.",
      }}
    >
      <MyWorkView />
    </PageContainer>
  );
}
