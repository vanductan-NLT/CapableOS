import type { AgentRow, TaskRow } from "../db-types";

type SupabaseListResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

type SupabaseSingleResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

export interface DecisionLoaderClient {
  from(table: "tasks"): {
    select(columns: string): {
      eq(column: "id", value: string): {
        maybeSingle(): Promise<SupabaseSingleResult>;
      };
    };
  };
  from(table: "agents"): {
    select(columns: string): {
      order(column: "type" | "name"): {
        order(column: "type" | "name"): Promise<SupabaseListResult>;
      };
    };
  };
}

export class DecisionLoaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecisionLoaderError";
  }
}

export async function loadTaskById(
  client: DecisionLoaderClient,
  taskId: string,
): Promise<TaskRow | null> {
  const { data, error } = await client.from("tasks").select("*").eq("id", taskId).maybeSingle();

  if (error) {
    throw new DecisionLoaderError(error.message);
  }

  return data as TaskRow | null;
}

export async function loadAgentPool(client: DecisionLoaderClient): Promise<AgentRow[]> {
  const { data, error } = await client
    .from("agents")
    .select("*")
    .order("type")
    .order("name");

  if (error) {
    throw new DecisionLoaderError(error.message);
  }

  return data as AgentRow[];
}
