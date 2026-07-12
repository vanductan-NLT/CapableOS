import { PageContainer } from "@/components/page-container";
import { MyWorkView } from "@/features/task/my-work-view";

export default function MyWorkPage() {
  return <PageContainer title="Việc của tôi" description="Nhận việc cần con người xử lý, review đầu ra AI và nộp kết quả."><MyWorkView /></PageContainer>;
}
