export type FunctionToolDef = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict: boolean | null;
};
