"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui";

/**
 * Bottom-docked chat composer (Claude/ChatGPT pattern): auto-grows with
 * content up to a cap then scrolls; Enter sends, Shift+Enter = newline.
 */
export function CommandComposer({
  value,
  onChange,
  onSubmit,
  pending,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function autosize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="border-t border-line bg-card/85 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-full border border-line bg-card p-2 shadow-[var(--elev-1)] focus-within:border-blue">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              autosize(e.target);
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Nhập việc cần giao, ví dụ: phân tích doanh số tháng này và đề xuất ai xử lý"
            aria-label="Nội dung công việc"
            maxLength={4000}
            className="max-h-[200px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none [touch-action:manipulation]"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim() || pending}
            aria-label="Gửi"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[image:var(--grad-cta)] text-white shadow-[var(--elev-1)] transition-opacity disabled:opacity-40 [touch-action:manipulation]"
          >
            <Icon name={pending ? "loader" : "send"} size={18} />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-center text-[11px] text-muted">
          Hệ thống tự đề xuất người, AI hoặc đội kết hợp; việc rủi ro sẽ chuyển sang phê duyệt.
        </p>
      </div>
    </div>
  );
}
