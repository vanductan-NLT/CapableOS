import { ok, route } from "@/lib/api";
import { CAPABILITIES, type CapabilitiesResult } from "@orchestra/contracts";

// GET /capabilities → string[]   (Owner: B)
// Trả về taxonomy chuẩn (Feature 0, domain A owns) — nguồn Planner dùng làm known_capabilities.
// KHÔNG suy ra từ pool: pool.caps chỉ là tập con; hệ thống "biết" đúng danh sách cố định này.
export const GET = route(async () => ok<CapabilitiesResult>([...CAPABILITIES]));
