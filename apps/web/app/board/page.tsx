import { TaskBoard } from "@/features/task/task-board";
import { PageContainer } from "@/components/page-container";

export default function BoardPage() {
  return (
    <PageContainer
      title={{ vi: "Luồng xử lý", en: "Workflow" }}
      description={{
        vi: "Toàn bộ việc, trạng thái, người hoặc AI đang chịu trách nhiệm.",
        en: "All work, its status, and the person or AI responsible.",
      }}
    >
      <TaskBoard />
    </PageContainer>
  );
}
