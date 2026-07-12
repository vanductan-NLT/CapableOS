import { TaskBoard } from "@/features/task/task-board";
import { PageContainer } from "@/components/page-container";

export default function BoardPage() {
  return (
    <PageContainer
      title="Luồng xử lý"
      description="Toàn bộ việc, trạng thái, người hoặc AI đang chịu trách nhiệm."
    >
      <TaskBoard />
    </PageContainer>
  );
}
