// Trace event schema. One RunEvent per line of a run's JSONL trace.

export interface Message {
  role: string;
  content: unknown;
}

export interface ToolDef {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export type Block = unknown;

export interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
}

export interface FaultRecord {
  kind: string;
  tool: string;
  params?: Record<string, unknown>;
}

export type RunEvent =
  | { t: number; kind: "model_request"; messages: Message[]; tools: ToolDef[] }
  | { t: number; kind: "model_response"; content: Block[]; usage: Usage; cached?: boolean; wouldBeCostUsd?: number }
  | {
      t: number;
      kind: "tool_call";
      id: string;
      tool: string;
      args: unknown;
      injected?: FaultRecord;
    }
  | {
      t: number;
      kind: "tool_result";
      id: string;
      ok: boolean;
      body: unknown;
      injected?: FaultRecord;
    }
  | { t: number; kind: "world_mutation"; world: string; op: string; state: unknown }
  | { t: number; kind: "agent_output"; text: string }
  | { t: number; kind: "agent_exit"; code: number; reason: string }
  | {
      t: number;
      kind: "budget_abort";
      cumulativeCostUsd: number;
      budgetUsd: number;
      model: string;
    };
