// Generate a stable-ish agent id when the UI doesn't supply one (FR-13).
export function agentId(type: "human" | "ai", name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics (Vietnamese tones)
    .replace(/đ/g, "d") // đ → d
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = crypto.randomUUID().slice(0, 4);
  return `${type === "human" ? "h" : "ai"}-${slug || "agent"}-${suffix}`;
}
