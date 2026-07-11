import { ApiFail } from "../api";
import { DecisionMapperError } from "./mapper";
import { DecisionRepositoryError } from "./repository";
import { RouteDecisionServiceError } from "./service";
import { QwenPlannerConfigError } from "./planner-options";

export function toRouteApiFail(error: unknown): ApiFail {
  if (error instanceof ApiFail) return error;

  if (error instanceof QwenPlannerConfigError) {
    return new ApiFail("upstream_error", "Planner provider is not available");
  }

  if (error instanceof RouteDecisionServiceError || error instanceof DecisionRepositoryError) {
    if (error.code === "not_found" || error.code === "conflict") {
      return new ApiFail(error.code, error.message);
    }

    return new ApiFail(error.code, stableMessage(error.code));
  }

  if (error instanceof DecisionMapperError) {
    return new ApiFail("internal_error", "Invalid persisted decision input");
  }

  return new ApiFail("internal_error", "Unexpected internal error");
}

function stableMessage(code: "internal_error" | "upstream_error" | "validation_error" | "unauthorized" | "forbidden" | "not_found" | "conflict"): string {
  switch (code) {
    case "upstream_error":
      return "Planner provider is not available";
    case "internal_error":
      return "Unexpected internal error";
    case "validation_error":
      return "Invalid input";
    case "unauthorized":
      return "Unauthorized";
    case "forbidden":
      return "Forbidden";
    case "not_found":
      return "Not found";
    case "conflict":
      return "Conflict";
  }
}
