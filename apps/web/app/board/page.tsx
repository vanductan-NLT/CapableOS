import { TaskBoard } from "@/features/task/task-board";

export default function BoardPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Task Board</h1>
        <p className="text-sm text-muted">Mọi task + trạng thái + người/agent xử lý · cập nhật realtime.</p>
      </div>
      <TaskBoard />
    </div>
  );
}
