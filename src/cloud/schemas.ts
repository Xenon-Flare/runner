import { z } from "zod";

const workspaceChatMessageSchema = z.object({
  id: z.string(),
  role: z.literal("user"),
  text: z.string(),
  subtitle: z.string().optional(),
  createdAtMs: z.number(),
});

const storedPriorSummarySchema = z
  .object({
    text: z.string(),
    fromMessageId: z.string(),
    throughMessageId: z.string(),
  })
  .nullable();

export const runnerContextSchema = z.object({
  workspaceId: z.string(),
  title: z.string().nullable(),
  legacyIdea: z.string().nullable(),
  messageCount: z.number(),
  recentMessages: z.array(workspaceChatMessageSchema),
  priorMessages: z.array(workspaceChatMessageSchema),
  recentText: z.string(),
  priorTextVerbatim: z.string(),
  recentTokenEstimate: z.number(),
  priorTokenEstimate: z.number(),
  priorNeedsSummarization: z.boolean(),
  storedPriorSummary: storedPriorSummarySchema,
  storedSummaryCoversPrior: z.boolean(),
});

export type RunnerContextPayload = z.infer<typeof runnerContextSchema>;

export const leaseOkSchema = z.object({
  leased: z.literal(true),
  workspaceId: z.string(),
  leaseExpiresAt: z.number(),
  workspace: z.record(z.unknown()),
});

export const runnerPayloadSchema = z
  .object({
    assistantMessage: z.string().optional(),
    files: z.array(z.unknown()).optional(),
    charts: z.array(z.unknown()).optional(),
    datasets: z.array(z.unknown()).optional(),
    svgs: z.array(z.unknown()).optional(),
    lists: z.array(z.unknown()).optional(),
    checklists: z.array(z.unknown()).optional(),
  })
  .transform((o) => ({
    assistantMessage: o.assistantMessage ?? "",
    files: o.files ?? [],
    charts: o.charts ?? [],
    datasets: o.datasets ?? [],
    svgs: o.svgs ?? [],
    lists: o.lists ?? [],
    checklists: o.checklists ?? [],
  }));

export type RunnerPayload = z.infer<typeof runnerPayloadSchema>;
