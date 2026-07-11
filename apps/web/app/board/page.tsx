import { BoardIcon, Badge } from "@orchestra/ui";
import { PageHeader } from "@/components/page-header";
import { TaskBoard } from "@/features/task/task-board";

export default function BoardPage() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Task Board"
        title="Bảng công việc"
        lead="Mọi task, trạng thái và người/agent xử lý — cập nhật realtime qua Supabase."
        icon={<BoardIcon size={20} />}
        actions={
          <Badge tone="b" dot>
            Realtime
          </Badge>
        }
      />
      <TaskBoard />
    </div>
  );
}
