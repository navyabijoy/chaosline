// RunEvent trace schema. See docs/02-architecture.md.

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
}

export interface FaultRecord {
  kind: string;
  tool: string;
  params?: Record<string, unknown>;
}

export type RunEvent =
  | { t: number; kind: "model_request"; messages: Message[]; tools: ToolDef[] }
  | { t: number; kind: "model_response"; content: Block[]; usage: Usage }
  | { t: number; kind: "tool_call"; id: string; tool: string; args: unknown }
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
  | { t: number; kind: "agent_exit"; code: number; reason: string };
